import * as Cabazooka from '@tobrien/cabazooka';
import { Config } from 'main';
import * as Logging from '../logging';
import * as Storage from '../util/storage';
import * as Media from '../util/media';
import * as OpenAI from '../util/openai';
import { stringifyJSON } from '../util/general';
import path from 'path';
import { ChatCompletionMessageParam } from 'openai/resources';
import * as Chat from '@tobrien/minorprompt/chat';
import * as Override from '../prompt/override';
import * as TranscribePrompt from '../prompt/transcribe';

export interface Transcription {
    text: string;
}

export interface Instance {
    transcribe: (creation: Date, outputPath: string, filename: string, hash: string, audioFile: string) => Promise<Transcription>;
}

export const create = (config: Config, operator: Cabazooka.Operator): Instance => {
    const logger = Logging.getLogger();
    const storage = Storage.create({ log: logger.debug });
    const media = Media.create(logger);
    const prompts = TranscribePrompt.create(config.composeModel as Chat.Model, config);

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

        // Check if audio file exceeds the size limit
        const fileSize = await media.getFileSize(audioFile);
        logger.debug(`Audio file size: ${fileSize} bytes, max size: ${config.maxAudioSize} bytes`);

        let transcription: OpenAI.Transcription;

        if (fileSize > config.maxAudioSize) {
            logger.info(`Audio file exceeds maximum size (${fileSize} > ${config.maxAudioSize} bytes), splitting into chunks`);

            // Create a temporary directory for the audio chunks
            const tempDir = path.join(config.tempDirectory, `split_audio_${hash}`);
            await storage.createDirectory(tempDir);

            try {
                // Split the audio file into chunks
                const audioChunks = await media.splitAudioFile(audioFile, tempDir, config.maxAudioSize);
                logger.info(`Split audio file into ${audioChunks.length} chunks`);

                // Transcribe each chunk
                const transcriptions: OpenAI.Transcription[] = [];
                for (let i = 0; i < audioChunks.length; i++) {
                    const chunkPath = audioChunks[i];
                    logger.info(`Transcribing chunk ${i + 1}/${audioChunks.length}: ${chunkPath}`);

                    const chunkDebugFile = config.debug ?
                        path.join(debugDir, `${baseDebugFilename}.transcription.chunk${i + 1}.raw.response.json`) :
                        undefined;

                    const chunkTranscription = await OpenAI.transcribeAudio(chunkPath, {
                        model: config.transcriptionModel,
                        debug: config.debug,
                        debugFile: chunkDebugFile
                    });

                    transcriptions.push(chunkTranscription);
                }

                // Combine all transcriptions
                const combinedText = transcriptions.map(t => t.text).join(' ');
                transcription = { text: combinedText };

                // Save the combined transcription
                if (config.debug) {
                    // Save each individual chunk for debugging
                    await storage.writeFile(
                        path.join(debugDir, `${baseDebugFilename}.transcription.combined.json`),
                        stringifyJSON({ chunks: transcriptions, combined: transcription }),
                        'utf8'
                    );
                }

                // Clean up temporary files if not in debug mode
                if (!config.debug) {
                    for (const chunk of audioChunks) {
                        try {
                            await storage.deleteFile(chunk);
                        } catch (error) {
                            logger.warn(`Failed to delete temporary chunk ${chunk}: ${error}`);
                        }
                    }
                }
            } catch (error) {
                logger.error(`Error processing split audio files: ${error}`);
                throw new Error(`Failed to process split audio files: ${error}`);
            }
        } else {
            // If file size is within the limit, transcribe normally
            transcription = await OpenAI.transcribeAudio(audioFile, {
                model: config.transcriptionModel,
                debug: config.debug,
                debugFile: transcriptionDebugFile
            });
        }

        // Save the transcription
        await storage.writeFile(transcriptOutputPath, stringifyJSON(transcription), 'utf8');
        logger.debug('Wrote transcription to %s', transcriptOutputPath);

        // Create markdown version of the transcript
        const markdownOutputFilename = transcriptOutputFilename.replace('.json', '.md');
        const markdownOutputPath = path.join(outputPath, markdownOutputFilename);

        // Only create the markdown file if it doesn't already exist
        if (!await storage.exists(markdownOutputPath)) {
            logger.info('Creating Markdown version of the transcription...');

            // Create a prompt for the transcription formatting task
            const prompt = await prompts.createTranscribePrompt(transcription.text);

            // Format the prompt using the override utility
            const chatRequest = Override.format(prompt, config.composeModel as Chat.Model);

            // Debug file paths for the request and response
            const requestDebugFile = config.debug ?
                path.join(debugDir, `${baseDebugFilename}.markdown.request.json`) :
                undefined;

            const responseDebugFile = config.debug ?
                path.join(debugDir, `${baseDebugFilename}.markdown.response.json`) :
                undefined;

            // Write debug file for the request if in debug mode
            if (config.debug && requestDebugFile) {
                await storage.writeFile(requestDebugFile, stringifyJSON(chatRequest), 'utf8');
                logger.debug('Wrote chat request to %s', requestDebugFile);
            }

            // Call the model to convert the transcription to markdown
            const markdownContent = await OpenAI.createCompletion(
                chatRequest.messages as ChatCompletionMessageParam[],
                {
                    model: config.composeModel,
                    debug: config.debug,
                    debugFile: responseDebugFile
                }
            );

            // Save the markdown version
            await storage.writeFile(markdownOutputPath, markdownContent, 'utf8');
            logger.debug('Wrote markdown transcription to %s', markdownOutputPath);
        } else {
            logger.info('Markdown transcription file %s already exists, skipping...', markdownOutputPath);
        }

        return transcription;
    }

    return {
        transcribe,
    }
} 