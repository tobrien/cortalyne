import { zodResponseFormat } from 'openai/helpers/zod';
import { DEFAULT_CLASSIFIED_RESPONSE_SCHEMA, DEFAULT_CLASSIFY_INSTRUCTIONS, DEFAULT_NOTE_INSTRUCTIONS, NOTE_INSTRUCTION_TYPES } from './constants';
import * as Logging from './logging';
import { Instance } from './process.d';
import * as Run from './run';
import * as OpenAI from './util/openai';
import * as Storage from './util/storage';

export const create = (runConfig: Run.Config): Instance => {
    const logger = Logging.getLogger();
    const storage = Storage.create({ log: logger.debug });

    const process = async (file: string) => {
        logger.debug('Processing file %s', file);

        const outputPath = `${runConfig.outputDirectory}/${file.replace(/\.[^/.]+$/, '')}.json`;
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
        }

        await storage.writeFile(outputPath, JSON.stringify(classifiedTranscription, null, 2), 'utf8');
        logger.debug('Wrote classified transcription to %s', outputPath);

        const noteOutputPath = `${runConfig.outputDirectory}/${file.replace(/\.[^/.]+$/, '')}.md`;
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