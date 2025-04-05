import { zodResponseFormat } from 'openai/helpers/zod';
import path from 'path';
import { DEFAULT_CLASSIFIED_RESPONSE_SCHEMA, DEFAULT_CLASSIFY_INSTRUCTIONS, DEFAULT_NOTE_INSTRUCTIONS, NOTE_INSTRUCTION_TYPES } from './constants';
import * as Logging from './logging';
import * as Output from './output';
import { ClassifiedTranscription, Instance } from './process.d';
import { Config as RunConfig } from './run.d';
import * as Media from './util/media';
import * as OpenAI from './util/openai';
import * as Storage from './util/storage';

// Helper function to promisify ffmpeg.

export const create = (runConfig: RunConfig): Instance => {
    const logger = Logging.getLogger();
    const storage = Storage.create({ log: logger.debug });
    const media = Media.create(logger);
    const output = Output.create(runConfig.timezone, runConfig.outputStructure, runConfig.filenameOptions);

    const createClassifiedTranscription = async (creation: Date, outputPath: string, filename: string, hash: string, audioFile: string): Promise<any> => {
        // Look for a file in the outputPath that contains the hash and has a .json extension - let me be clear, the file name might have a lot of other stuff.  I need you to look for any filename that has that hash value in it.  Could you use a regexp?
        const jsonOutputPath = path.join(outputPath, filename + '.json');
        const files = await storage.listFiles(outputPath);
        const matchingFiles = files.filter((file: string) => file.includes(hash) && file.endsWith('.json'));
        if (matchingFiles.length > 0) {
            logger.info('Transcription ClassificationOutput file %s already exists, returning existing content...', matchingFiles[0]);
            const existingContent = await storage.readFile(jsonOutputPath, 'utf8');
            return JSON.parse(existingContent);
        }


        logger.debug('Checking if output file %s exists', jsonOutputPath);
        if (await storage.exists(jsonOutputPath)) {
            logger.info('Output file %s already exists, returning existing content...', jsonOutputPath);
            const existingContent = await storage.readFile(jsonOutputPath, 'utf8');
            return JSON.parse(existingContent);
        }

        const transcription: OpenAI.Transcription = await OpenAI.transcribeAudio(audioFile, logger, { model: runConfig.transcriptionModel });
        // logger.debug('Processing complete: output: %s', transcription);

        const prompt = `
            <instructions>${DEFAULT_CLASSIFY_INSTRUCTIONS}</instructions>\n\n
            <transcript>\n${transcription.text}\n</transcript>
        `;


        logger.debug('Classified Transcription Prompt: %s', prompt);
        logger.debug('Classified Transcription Response Format: %s', zodResponseFormat(DEFAULT_CLASSIFIED_RESPONSE_SCHEMA, 'classifiedTranscription'));
        const contextCompletion = await OpenAI.createCompletion(prompt, logger, { responseFormat: zodResponseFormat(DEFAULT_CLASSIFIED_RESPONSE_SCHEMA, 'classifiedTranscription'), model: runConfig.model });

        const classifiedTranscription = {
            ...contextCompletion,
            text: transcription.text,
            recordingTime: creation ? creation.toISOString() : undefined
        }

        await storage.writeFile(jsonOutputPath, JSON.stringify(classifiedTranscription, null, 2), 'utf8');
        logger.debug('Wrote classified transcription to %s', jsonOutputPath);

        return classifiedTranscription;
    }

    const createNote = async (classifiedTranscription: ClassifiedTranscription, outputPath: string, filename: string, hash: string): Promise<any> => {
        // Look for a file in the outputPath that contains the hash and has a .json extension - let me be clear, the file name might have a lot of other stuff.  I need you to look for any filename that has that hash value in it.  Could you use a regexp?
        const files = await storage.listFiles(outputPath);
        const matchingFiles = files.filter((file: string) => file.includes(hash) && file.endsWith('.md'));
        if (matchingFiles.length > 0) {
            logger.info('Transcribed Note file %s already exists, skipping', matchingFiles[0]);
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

        const noteOutputPath = path.join(outputPath, filename + '.md');
        await storage.writeFile(noteOutputPath, Buffer.from(noteCompletion, 'utf8'), 'utf8');
        logger.debug('Wrote note to %s', noteOutputPath);

        return noteCompletion;
    }

    const process = async (audioFile: string) => {
        logger.debug('Processing file %s', audioFile);

        // Extract audio file creation time
        const creationTime = await media.getAudioCreationTime(audioFile);
        if (creationTime) {
            logger.info('Audio recording time: %s', creationTime.toISOString());
        } else {
            logger.warn('Could not determine audio recording time for %s, skipping', audioFile);
            return;
        }

        // Calculate the hash of file and output directory
        const hash = (await storage.hashFile(audioFile, 100)).substring(0, 8);
        const outputPath: string = output.constructOutputDirectory(creationTime, runConfig.outputDirectory);
        const transcriptionFilename = output.constructFilename(creationTime, 'transcription', hash);

        // Create the transcription
        const classifiedTranscription = await createClassifiedTranscription(creationTime, outputPath, transcriptionFilename, hash, audioFile);

        // Create the note
        const noteFilename = output.constructFilename(creationTime, classifiedTranscription.type, hash, { subject: classifiedTranscription.subject });
        await createNote(classifiedTranscription, outputPath, noteFilename, hash);

        logger.info('Processed file %s', audioFile);
        return;
    }

    return {
        process,
    }
}


