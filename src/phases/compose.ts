import * as Chat from '@tobrien/minorprompt/chat';
import { ChatCompletionMessageParam } from 'openai/resources';
import path from 'path';
import * as Logging from '../logging';
import { Config } from '../cortalyne';
import { ClassifiedTranscription } from '../processor';
import * as Override from '../prompt/override';
import * as Prompt from '../prompt/prompts';
import { stringifyJSON } from '../util/general';
import * as OpenAI from '../util/openai';
import * as Storage from '../util/storage';
// Helper function to promisify ffmpeg.

export interface Instance {
    compose: (transcription: ClassifiedTranscription, outputPath: string, filename: string, hash: string) => Promise<any>;
}

export const create = (config: Config): Instance => {
    const logger = Logging.getLogger();
    const storage = Storage.create({ log: logger.debug });
    const prompts = Prompt.create(config.composeModel as Chat.Model, config);

    const compose = async (transcription: ClassifiedTranscription, outputPath: string, filename: string, hash: string): Promise<any> => {
        // Look for a file in the outputPath that contains the hash and has a .json extension - let me be clear, the file name might have a lot of other stuff.  I need you to look for any filename that has that hash value in it.  Could you use a regexp?
        const files = await storage.listFiles(outputPath);
        const matchingFiles = files.filter((file: string) => file.includes(filename) && file.endsWith('.md'));
        if (matchingFiles.length > 0) {
            logger.info('Transcribed Note file %s already exists, skipping', matchingFiles[0]);
            return;
        }

        // Check to see if the Note already exists...
        const noteOutputPath = path.join(outputPath, filename + '.md');
        logger.debug('Checking if output file %s exists', noteOutputPath);
        if (await storage.exists(noteOutputPath)) {
            logger.info('Output file %s already exists, returning existing content...', noteOutputPath);
            const existingContent = await storage.readFile(noteOutputPath, 'utf8');
            return existingContent;
        }

        const chatRequest: Chat.Request = Override.format(await prompts.createComposePrompt(transcription, transcription.type), config.model as Chat.Model);

        if (config.debug) {
            const debugDir = path.join(outputPath, 'debug');
            await storage.createDirectory(debugDir);
            const requestOutputPath = path.join(debugDir, filename + '.request.json');
            await storage.writeFile(requestOutputPath, stringifyJSON(chatRequest), 'utf8');
            logger.debug('Wrote chat request to %s', requestOutputPath);
        }

        const debugResponsePath = config.debug ? path.join(outputPath, 'debug', filename + '.response.json') : undefined;
        const noteCompletion: string = await OpenAI.createCompletion(chatRequest.messages as ChatCompletionMessageParam[], { model: config.model, debug: config.debug, debugFile: debugResponsePath });

        await storage.writeFile(noteOutputPath, Buffer.from(noteCompletion, 'utf8'), 'utf8');
        logger.debug('Wrote note to %s', noteOutputPath);

        return noteCompletion;
    }

    return {
        compose,
    }
}


