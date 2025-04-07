import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import * as Storage from './storage';
import { getLogger } from '../logging';
export interface Transcription {
    text: string;
}

export class OpenAIError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OpenAIError';
    }
}


export async function createCompletion(messages: ChatCompletionMessageParam[], options: { responseFormat?: any, model?: string, debug?: boolean, debugFile?: string } = { model: "gpt-4o-mini" }): Promise<string | any> {
    const logger = getLogger();
    const storage = Storage.create({ log: logger.debug });
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new OpenAIError('OPENAI_API_KEY environment variable is not set');
        }

        const openai = new OpenAI({
            apiKey: apiKey,
        });

        logger.debug('Sending prompt to OpenAI: %j', messages);

        const completion = await openai.chat.completions.create({
            model: options.model || "gpt-4o-mini",
            messages,
            max_completion_tokens: 10000,
            response_format: options.responseFormat,
        });

        if (options.debug && options.debugFile) {
            await storage.writeFile(options.debugFile, JSON.stringify(completion, null, 2), 'utf8');
            logger.debug('Wrote debug file to %s', options.debugFile);
        }

        const response = completion.choices[0]?.message?.content?.trim();
        if (!response) {
            throw new OpenAIError('No response received from OpenAI');
        }

        logger.debug('Received response from OpenAI: %s', response);
        if (options.responseFormat) {
            return JSON.parse(response);
        } else {
            return response;
        }

    } catch (error: any) {
        logger.error('Error calling OpenAI API: %s %s', error.message, error.stack);
        throw new OpenAIError(`Failed to create completion: ${error.message}`);
    }
}

export async function transcribeAudio(filePath: string, options: { model?: string, debug?: boolean, debugFile?: string } = { model: "whisper-1" }): Promise<Transcription> {
    const logger = getLogger();
    const storage = Storage.create({ log: logger.debug });
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new OpenAIError('OPENAI_API_KEY environment variable is not set');
        }

        const openai = new OpenAI({
            apiKey: apiKey,
        });

        logger.debug('Transcribing audio file: %s', filePath);

        const audioStream = await storage.readStream(filePath);
        const transcription = await openai.audio.transcriptions.create({
            model: options.model || "whisper-1",
            file: audioStream,
            response_format: "json",
        });

        if (options.debug && options.debugFile) {
            await storage.writeFile(options.debugFile, JSON.stringify(transcription, null, 2), 'utf8');
            logger.debug('Wrote debug file to %s', options.debugFile);
        }

        const response = transcription;
        if (!response) {
            throw new OpenAIError('No transcription received from OpenAI');
        }

        logger.debug('Received transcription from OpenAI: %s', response);
        return response;

    } catch (error: any) {
        logger.error('Error transcribing audio file: %s %s', error.message, error.stack);
        throw new OpenAIError(`Failed to transcribe audio: ${error.message}`);
    }
}
