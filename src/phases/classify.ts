import * as Cabazooka from '@tobrien/cabazooka';
import * as Chat from '@tobrien/minorprompt/chat';
import { Config } from 'main';
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
// Helper function to promisify ffmpeg.
export interface Instance {
    classify: (creation: Date, outputPath: string, filename: string, hash: string, audioFile: string) => Promise<ClassifiedTranscription>;
}

export const create = (config: Config, operator: Cabazooka.Operator): Instance => {
    const logger = Logging.getLogger();
    const storage = Storage.create({ log: logger.debug });
    const prompts = Prompt.create(config.classifyModel as Chat.Model, config);

    const classify = async (creation: Date, outputPath: string, filename: string, hash: string, audioFile: string): Promise<any> => {
        // Look for a file in the outputPath that contains the hash and has a .json extension - let me be clear, the file name might have a lot of other stuff.  I need you to look for any filename that has that hash value in it.  Could you use a regexp?
        if (!outputPath) {
            throw new Error("outputPath is required for classify function");
        }

        const jsonOutputPath = await operator.constructFilename(creation, 'classification', hash);
        const files = await storage.listFiles(outputPath);
        const matchingFiles = files.filter((file: string) => file.includes(hash) && file.endsWith('.json'));
        if (matchingFiles.length > 0) {
            logger.info('Transcription ClassificationOutput file %s already exists, returning existing content...', matchingFiles[0]);
            const existingContent = await storage.readFile(jsonOutputPath, 'utf8');
            return JSON.parse(existingContent);
        }

        // Check to see if the ClassifiedTranscription already exists...
        logger.debug('Checking if output file %s exists', jsonOutputPath);
        if (await storage.exists(jsonOutputPath)) {
            logger.info('Output file %s already exists, returning existing content...', jsonOutputPath);
            const existingContent = await storage.readFile(jsonOutputPath, 'utf8');
            return JSON.parse(existingContent);
        }

        const transcription: OpenAI.Transcription = await OpenAI.transcribeAudio(audioFile, { model: config.transcriptionModel, debug: config.debug, debugFile: jsonOutputPath.replace('.json', '.transcription.response.json') });
        // logger.debug('Processing complete: output: %s', transcription);

        const chatRequest: Chat.Request = Override.format(await prompts.createClassificationPrompt(transcription.text), config.model as Chat.Model);

        if (config.debug) {
            const requestOutputPath = jsonOutputPath.replace('.json', '.request.json');
            await storage.writeFile(requestOutputPath, stringifyJSON(chatRequest), 'utf8');
            logger.debug('Wrote chat request to %s', requestOutputPath);
        }

        const contextCompletion = await OpenAI.createCompletion(chatRequest.messages as ChatCompletionMessageParam[], { responseFormat: zodResponseFormat(DEFAULT_CLASSIFIED_RESPONSE_SCHEMA, 'classifiedTranscription'), model: config.model, debug: config.debug, debugFile: jsonOutputPath.replace('.json', '.response.json') });

        const classifiedTranscription = {
            ...contextCompletion,
            text: transcription.text,
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


