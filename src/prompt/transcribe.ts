import * as MinorPrompt from '@tobrien/minorprompt';
import * as Chat from '@tobrien/minorprompt/chat';
import { createPersona, Persona, createInstruction, Instruction, Section } from "@tobrien/minorprompt";
import { Config } from '../cortalyne';
import * as Context from './context';
import * as Override from './override';
import { DEFAULT_PERSONA_TRANSCRIBE_TRAITS_FILE, DEFAULT_PERSONA_TRANSCRIBE_INSTRUCTIONS_FILE, DEFAULT_INSTRUCTIONS_TRANSCRIBE_FILE } from '../constants';
import { getLogger } from '../logging';

// Default persona traits for the transcription formatter
const PERSONA_TRANSCRIBE_TRAITS: string = `
You are a helpful assistant that specializes in converting text transcriptions to well-formatted Markdown.
`;

// Default persona instructions for the transcription formatter
const PERSONA_TRANSCRIBE_INSTRUCTIONS: string = `
When formatting transcriptions, maintain the original content verbatim while organizing it into a readable structure.
Create appropriate headings based on the content and arrange text into logical paragraphs.
`;

// Default instructions for the transcription formatting task
const INSTRUCTIONS_TRANSCRIBE: string = `
Please take the content in this transcription and convert it, verbatim, to a Markdown format with headings and paragraphs.
Identify the main topics and create appropriate headings.
Split the text into logical paragraphs while preserving the original meaning and intent.
Do not add any new information or interpret the content beyond its literal meaning, and don't add new information from the context to the content generated.
Use information in the context to help identify names and other entities to ensure that they are spelled correctly.
`;

/**
 * Creates a persona for the transcription formatting task
 */
export const createTranscribePersona = async (
    configDir: string,
    overrides: boolean,
    { customize }: { customize: (configDir: string, overrideFile: string, content: string, overrides: boolean) => Promise<string> }
): Promise<Persona> => {
    const logger = getLogger();
    const finalTraits = await customize(configDir, DEFAULT_PERSONA_TRANSCRIBE_TRAITS_FILE, PERSONA_TRANSCRIBE_TRAITS, overrides);
    const finalInstructions = await customize(configDir, DEFAULT_PERSONA_TRANSCRIBE_INSTRUCTIONS_FILE, PERSONA_TRANSCRIBE_INSTRUCTIONS, overrides);

    logger.debug('Final Transcribe traits: %s', finalTraits);
    logger.debug('Final Transcribe instructions: %s', finalInstructions);

    const persona = createPersona("transcriber");
    persona.addTrait(finalTraits);
    persona.addInstruction(finalInstructions);
    return persona;
};

/**
 * Creates instructions for the transcription formatting task
 */
export const createTranscribeInstructions = async (
    configDir: string,
    overrides: boolean,
    { customize }: { customize: (configDir: string, overrideFile: string, content: string, overrides: boolean) => Promise<string> }
): Promise<(Instruction | Section<Instruction>)[]> => {
    const instructions: (Instruction | Section<Instruction>)[] = [];

    const finalInstructions = await customize(configDir, DEFAULT_INSTRUCTIONS_TRANSCRIBE_FILE, INSTRUCTIONS_TRANSCRIBE, overrides);
    instructions.push(createInstruction(finalInstructions));

    return instructions;
};

/**
 * Creates a prompt for the transcription formatting task
 */
export const createTranscribePrompt = async (
    transcriptionText: string,
    config: Config
): Promise<MinorPrompt.Instance> => {
    const prompt: MinorPrompt.Instance = MinorPrompt.create();

    // Add persona
    prompt.addPersona(await createTranscribePersona(config.configDirectory, config.overrides, { customize: Override.customize }));

    // Add instructions
    const instructions = await createTranscribeInstructions(config.configDirectory, config.overrides, { customize: Override.customize });
    instructions.forEach((instruction) => {
        prompt.addInstruction(instruction);
    });

    // Add the transcription text as content
    prompt.addContent(transcriptionText);

    // Add context sections if available
    if (config.contextDirectories && config.contextDirectories.length > 0) {
        const contextSections = await Context.loadContextFromDirectories(config.contextDirectories);
        contextSections.forEach((section) => {
            prompt.addContext(section);
        });
    }

    return prompt;
};

/**
 * Factory interface for transcribe prompts
 */
export interface Factory {
    createTranscribePrompt: (transcriptionText: string) => Promise<MinorPrompt.Instance>;
}

/**
 * Create a factory for transcribe prompts
 */
export const create = (model: Chat.Model, config: Config): Factory => {
    return {
        createTranscribePrompt: async (transcriptionText: string): Promise<MinorPrompt.Instance> => {
            return createTranscribePrompt(transcriptionText, config);
        }
    };
}; 