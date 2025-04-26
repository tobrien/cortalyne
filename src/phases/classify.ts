import * as Cabazooka from '@tobrien/cabazooka';
import * as Chat from '@tobrien/minorprompt/chat';
import { Config } from '../cortalyne';
import { zodResponseFormat } from 'openai/helpers/zod';
import { ChatCompletionMessageParam } from 'openai/resources';
import { ClassifiedTranscription } from 'processor';
import { DEFAULT_CLASSIFIED_RESPONSE_SCHEMA } from '../constants';
import * as Logging from '../logging';
import * as Prompt from '../prompt/prompts';
import { stringifyJSON } from '../util/general';
import * as OpenAI from '../util/openai';
import * as Storage from '../util/storage';
import * as Override from '../prompt/override';
import path from 'path';

// Helper function to promisify ffmpeg.
export interface Instance {
    classify: (creation: Date, outputPath: string, transcriptionText: string, hash: string) => Promise<ClassifiedTranscription>;
}

export const create = (config: Config, operator: Cabazooka.Operator): Instance => {
    const logger = Logging.getLogger();
    const storage = Storage.create({ log: logger.debug });
    const prompts = Prompt.create(config.classifyModel as Chat.Model, config);

    const classify = async (creation: Date, outputPath: string, transcriptionText: string, hash: string): Promise<ClassifiedTranscription> => {
        if (!outputPath) {
            throw new Error("outputPath is required for classify function");
        }

        if (!transcriptionText) {
            throw new Error("transcriptionText is required for classify function");
        }

        let jsonOutputFilename = await operator.constructFilename(creation, 'classification', hash);
        // Ensure the filename ends with .json
        if (!jsonOutputFilename.endsWith('.json')) {
            logger.warn('constructFilename did not return a .json file, appending extension: %s', jsonOutputFilename);
            jsonOutputFilename += '.json';
        }

        const jsonOutputPath = path.join(outputPath, jsonOutputFilename);
        const files = await storage.listFiles(outputPath);
        const matchingFiles = files.filter((file: string) => file.includes(hash) && file.includes('classification') && file.endsWith('.json'));

        if (matchingFiles.length > 0) {
            logger.info('Transcription ClassificationOutput file %s already exists, returning existing content...', matchingFiles[0]);
            const existingContent = await storage.readFile(jsonOutputPath, 'utf8');
            return JSON.parse(existingContent);
        }

        const debugDir = path.join(outputPath, 'debug');
        await storage.createDirectory(debugDir);

        const baseDebugFilename = path.parse(jsonOutputFilename).name;

        // Generate classification prompt using the transcription text
        const chatRequest: Chat.Request = Override.format(await prompts.createClassificationPrompt(transcriptionText), config.model as Chat.Model);

        if (config.debug) {
            const requestDebugFile = path.join(debugDir, `${baseDebugFilename}.request.json`);
            await storage.writeFile(requestDebugFile, stringifyJSON(chatRequest), 'utf8');
            logger.debug('Wrote chat request to %s', requestDebugFile);
        }

        const completionDebugFile = config.debug ? path.join(debugDir, `${baseDebugFilename}.response.json`) : undefined;
        const contextCompletion = await OpenAI.createCompletion(chatRequest.messages as ChatCompletionMessageParam[], {
            responseFormat: zodResponseFormat(DEFAULT_CLASSIFIED_RESPONSE_SCHEMA, 'classifiedTranscription'),
            model: config.model,
            debug: config.debug,
            debugFile: completionDebugFile
        });

        const classifiedTranscription = {
            ...contextCompletion,
            text: transcriptionText,
            recordingTime: creation ? creation.toISOString() : undefined
        }

        await storage.writeFile(jsonOutputPath, JSON.stringify(classifiedTranscription, null, 2), 'utf8');
        logger.debug('Wrote classified transcription to %s', jsonOutputPath);

        return classifiedTranscription;
    }

    return {
        classify,
    }
}


