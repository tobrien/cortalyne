import { OpenAI } from 'openai';
import { Logger } from 'winston';
import * as Storage from './storage';

export interface Transcription {
    text: string;
}

export class OpenAIError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OpenAIError';
    }
}


export async function createCompletion(prompt: string, logger: Logger, options: { responseFormat?: any, model?: string } = { model: "gpt-4o-mini" }): Promise<string | any> {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new OpenAIError('OPENAI_API_KEY environment variable is not set');
        }

        const openai = new OpenAI({
            apiKey: apiKey,
        });

        logger.debug('Sending prompt to OpenAI: %s', prompt);

        const completion = await openai.chat.completions.create({
            model: options.model || "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_completion_tokens: 10000,
            response_format: options.responseFormat,
        });

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

export async function transcribeAudio(filePath: string, logger: Logger, options: { model?: string } = { model: "whisper-1" }): Promise<Transcription> {
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
