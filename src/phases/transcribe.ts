import * as Cabazooka from '@tobrien/cabazooka';
import { Config } from 'main';
import * as Logging from '../logging';
import * as Storage from '../util/storage';
import * as OpenAI from '../util/openai';
import { stringifyJSON } from '../util/general';
import path from 'path';

export interface Transcription {
    text: string;
}

export interface Instance {
    transcribe: (creation: Date, outputPath: string, filename: string, hash: string, audioFile: string) => Promise<Transcription>;
}

export const create = (config: Config, operator: Cabazooka.Operator): Instance => {
    const logger = Logging.getLogger();
    const storage = Storage.create({ log: logger.debug });

    const transcribe = async (creation: Date, outputPath: string, filename: string, hash: string, audioFile: string): Promise<Transcription> => {
        if (!outputPath) {
            throw new Error("outputPath is required for transcribe function");
        }

        if (!audioFile) {
            throw new Error("audioFile is required for transcribe function");
        }

        let transcriptOutputFilename = await operator.constructFilename(creation, 'transcript', hash);
        // Ensure the filename ends with .json
        if (!transcriptOutputFilename.endsWith('.json')) {
            logger.warn('constructFilename did not return a .json file for transcript, appending extension: %s', transcriptOutputFilename);
            transcriptOutputFilename += '.json';
        }

        const transcriptOutputPath = path.join(outputPath, transcriptOutputFilename);

        // Check if transcription already exists
        if (await storage.exists(transcriptOutputPath)) {
            logger.info('Transcription file %s already exists, returning existing content...', transcriptOutputPath);
            const existingContent = await storage.readFile(transcriptOutputPath, 'utf8');
            return JSON.parse(existingContent);
        }

        const debugDir = path.join(outputPath, 'debug');
        await storage.createDirectory(debugDir);

        const baseDebugFilename = path.parse(transcriptOutputFilename).name;
        const transcriptionDebugFile = config.debug ? path.join(debugDir, `${baseDebugFilename}.transcription.raw.response.json`) : undefined;

        // Call OpenAI to transcribe the audio
        const transcription: OpenAI.Transcription = await OpenAI.transcribeAudio(audioFile, {
            model: config.transcriptionModel,
            debug: config.debug,
            debugFile: transcriptionDebugFile
        });

        // Save the raw whisper response
        await storage.writeFile(transcriptOutputPath, stringifyJSON(transcription), 'utf8');
        logger.debug('Wrote raw whisper response to %s', transcriptOutputPath);

        return transcription;
    }

    return {
        transcribe,
    }
} 