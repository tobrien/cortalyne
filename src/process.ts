import { zodResponseFormat } from 'openai/helpers/zod';
import { DEFAULT_CLASSIFIED_RESPONSE_SCHEMA, DEFAULT_CLASSIFY_INSTRUCTIONS, DEFAULT_NOTE_INSTRUCTIONS, NOTE_INSTRUCTION_TYPES } from './constants';
import * as Logging from './logging';
import { Instance } from './process.d';
import * as Run from './run';
import * as OpenAI from './util/openai';
import * as Storage from './util/storage';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { Logger } from 'winston';

// Helper function to promisify ffmpeg.ffprobe
const ffprobeAsync = (filePath: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata);
        });
    });
};

// Extract creation time from audio file using ffmpeg
const getAudioCreationTime = async (filePath: string, logger: Logger): Promise<Date | null> => {
    try {
        const metadata = await ffprobeAsync(filePath);

        // Look for creation_time in format tags
        const formatTags = metadata?.format?.tags;
        if (formatTags?.creation_time) {
            logger.debug('Found creation_time in format tags: %s', formatTags.creation_time);
            return new Date(formatTags.creation_time);
        }

        // Check for creation_time in stream tags as fallback
        if (metadata?.streams?.length > 0) {
            for (const stream of metadata.streams) {
                if (stream.tags?.creation_time) {
                    logger.debug('Found creation_time in stream tags: %s', stream.tags.creation_time);
                    return new Date(stream.tags.creation_time);
                }
            }
        }

        logger.debug('No creation_time found in audio file metadata');
        return null;
    } catch (error) {
        logger.error('Error extracting creation time from audio file: %s', error);
        return null;
    }
};

export const create = (runConfig: Run.Config): Instance => {
    const logger = Logging.getLogger();
    const storage = Storage.create({ log: logger.debug });

    const process = async (file: string) => {
        logger.debug('Processing file %s', file);

        // Extract audio file creation time
        const creationTime = await getAudioCreationTime(file, logger);
        if (creationTime) {
            logger.info('Audio recording time: %s', creationTime.toISOString());
        } else {
            logger.warn('Could not determine audio recording time for %s', file);
        }

        const outputPath = path.join(runConfig.outputDirectory, file.replace(/\.[^/.]+$/, '') + '.json');
        logger.debug('Checking if output file %s exists', outputPath);
        if (await storage.exists(outputPath)) {
            logger.info('Output file %s already exists, skipping', outputPath);
            return;
        }



        const transcription: OpenAI.Transcription = await OpenAI.transcribeAudio(file, logger, { model: runConfig.transcriptionModel });
        // logger.debug('Processing complete: output: %s', transcription);

        const prompt = `
            <instructions>${DEFAULT_CLASSIFY_INSTRUCTIONS}</instructions>\n\n
            <transcript>\n${transcription.text}\n</transcript>
        `;


        logger.debug('Classified TranscriptionPrompt: %s', prompt);
        logger.debug('Response Format: %s', zodResponseFormat(DEFAULT_CLASSIFIED_RESPONSE_SCHEMA, 'classifiedTranscription'));
        const contextCompletion = await OpenAI.createCompletion(prompt, logger, { responseFormat: zodResponseFormat(DEFAULT_CLASSIFIED_RESPONSE_SCHEMA, 'classifiedTranscription'), model: runConfig.model });

        const classifiedTranscription = {
            ...contextCompletion,
            text: transcription.text,
            recordingTime: creationTime ? creationTime.toISOString() : undefined
        }

        await storage.writeFile(outputPath, JSON.stringify(classifiedTranscription, null, 2), 'utf8');
        logger.debug('Wrote classified transcription to %s', outputPath);

        const noteOutputPath = path.join(runConfig.outputDirectory, file.replace(/\.[^/.]+$/, '') + '.md');
        const noteOutputExists = await storage.exists(noteOutputPath);
        if (noteOutputExists) {
            logger.info('Note output file %s already exists, skipping', noteOutputPath);
            return;
        }

        const notePrompt = `
            <instructions>\n
                ${DEFAULT_NOTE_INSTRUCTIONS}\n
                ${NOTE_INSTRUCTION_TYPES[classifiedTranscription.type as keyof typeof NOTE_INSTRUCTION_TYPES]}\n
            </instructions>\n\n
            <classifiedTranscript>${JSON.stringify(classifiedTranscription, null, 2)}</classifiedTranscript>
        `;

        logger.debug('Note Prompt: %s', notePrompt);
        const noteCompletion: string = await OpenAI.createCompletion(notePrompt, logger, { model: runConfig.model });

        await storage.writeFile(noteOutputPath, Buffer.from(noteCompletion, 'utf8'), 'utf8');
        logger.debug('Wrote note to %s', noteOutputPath);

    }

    return {
        process,
    }
}