import * as Chat from '@tobrien/minorprompt/chat';
import { ChatCompletionMessageParam } from 'openai/resources';
import path from 'path';
import * as Logging from '../logging';
import { ClassifiedTranscription } from '../process.d';
import * as Prompt from '../prompt/prompts';
import { Config as RunConfig } from '../run.d';
import * as OpenAI from '../util/openai';
import * as Storage from '../util/storage';
import { stringifyJSON } from '../util/general';

// Helper function to promisify ffmpeg.

export interface Instance {
    compose: (transcription: ClassifiedTranscription, outputPath: string, filename: string, hash: string) => Promise<any>;
}

export const create = (runConfig: RunConfig): Instance => {
    const logger = Logging.getLogger();
    const storage = Storage.create({ log: logger.debug });
    const prompts = Prompt.create(runConfig.composeModel as Chat.Model, runConfig);

    const compose = async (transcription: ClassifiedTranscription, outputPath: string, filename: string, hash: string): Promise<any> => {
        // Look for a file in the outputPath that contains the hash and has a .json extension - let me be clear, the file name might have a lot of other stuff.  I need you to look for any filename that has that hash value in it.  Could you use a regexp?
        const files = await storage.listFiles(outputPath);
        const matchingFiles = files.filter((file: string) => file.includes(hash) && file.endsWith('.md'));
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

        const chatRequest: Chat.Request = prompts.format(await prompts.createComposePrompt(transcription, transcription.type));

        if (runConfig.debug) {
            const requestOutputPath = noteOutputPath.replace('.md', '.request.json');
            await storage.writeFile(requestOutputPath, stringifyJSON(chatRequest), 'utf8');
            logger.debug('Wrote chat request to %s', requestOutputPath);
        }

        const noteCompletion: string = await OpenAI.createCompletion(chatRequest.messages as ChatCompletionMessageParam[], { model: runConfig.model, debug: runConfig.debug, debugFile: noteOutputPath.replace('.md', '.response.json') });

        await storage.writeFile(noteOutputPath, Buffer.from(noteCompletion, 'utf8'), 'utf8');
        logger.debug('Wrote note to %s', noteOutputPath);

        return noteCompletion;
    }

    return {
        compose,
    }
}


