import { Chat, createPrompt, createSection, Prompt } from "@tobrien/minorprompt";
import { DEFAULT_INSTRUCTIONS_TRANSCRIBE_FILE, DEFAULT_PERSONA_TRANSCRIBE_FILE } from '../constants';
import { Config } from '../cortalyne';
import * as Context from './context';
import { create as createInstructions } from './instructions/instructions';
import { create as createPersona } from './persona/persona';

/**
 * Creates a prompt for the transcription formatting task
 */
export const createTranscribePrompt = async (
    transcriptionText: string,
    config: Config
): Promise<Prompt> => {

    const persona = await createPersona("transcriber", config.configDirectory, DEFAULT_PERSONA_TRANSCRIBE_FILE, config.overrides);
    const instructions = await createInstructions("transcribe", config.configDirectory, DEFAULT_INSTRUCTIONS_TRANSCRIBE_FILE, config.overrides);

    const content = createSection("Content");
    content.add(transcriptionText);

    const context = createSection("Context");
    // Add context sections if available
    if (config.contextDirectories && config.contextDirectories.length > 0) {
        const contextSections = await Context.loadContextFromDirectories(config.contextDirectories);
        contextSections.forEach((section) => {
            context.add(section);
        });
    }

    const prompt = createPrompt(persona, content, context, instructions);
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