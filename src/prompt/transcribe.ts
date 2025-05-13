import { Builder, Chat, Prompt } from "@tobrien/minorprompt";
import { DEFAULT_INSTRUCTIONS_TRANSCRIBE_FILE, DEFAULT_PERSONA_TRANSCRIBER_FILE } from '@/constants';
import { Config } from '@/cortalyne';
import { fileURLToPath } from "url";
import path from "path";
import { getLogger } from "@/logging";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a prompt for the transcription formatting task
 */
export const createTranscribePrompt = async (
    transcriptionText: string,
    config: Config
): Promise<Prompt> => {
    const logger = getLogger();
    let builder: Builder.Instance = Builder.create({ logger, basePath: __dirname, overridePath: config.configDirectory, overrides: config.overrides });
    builder = await builder.addPersonaPath(DEFAULT_PERSONA_TRANSCRIBER_FILE);
    builder = await builder.addInstructionPath(DEFAULT_INSTRUCTIONS_TRANSCRIBE_FILE);
    builder = await builder.addContent(transcriptionText);
    if (config.contextDirectories) {
        builder = await builder.loadContext(config.contextDirectories);
    }

    const prompt = await builder.build();
    return prompt;
};

/**
 * Factory interface for transcribe prompts
 */
export interface Factory {
    createTranscribePrompt: (transcriptionText: string) => Promise<Prompt>;
}

/**
 * Create a factory for transcribe prompts
 */
export const create = (model: Chat.Model, config: Config): Factory => {
    return {
        createTranscribePrompt: async (transcriptionText: string): Promise<Prompt> => {
            return createTranscribePrompt(transcriptionText, config);
        }
    };
}; 