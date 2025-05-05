import { createPrompt, createSection, Model, Prompt } from '@tobrien/minorprompt';
import { DEFAULT_INSTRUCTIONS_CLASSIFY_FILE, DEFAULT_INSTRUCTIONS_COMPOSE_FILE, DEFAULT_PERSONA_CLASSIFIER_FILE, DEFAULT_PERSONA_YOU_FILE, DEFAULT_TYPE_INSTRUCTIONS_DIR } from '../constants';
import { ClassifiedTranscription } from 'processor';
import { Config } from '../cortalyne';
import { stringifyJSON } from '../util/general';
import * as Context from './context';
import * as Instructions from './instructions/instructions';
import * as Persona from './persona/persona';

export interface Factory {
    createClassificationPrompt: (transcription: string) => Promise<Prompt>;
    createComposePrompt: (transcription: ClassifiedTranscription, noteType: string) => Promise<Prompt>;
}

export const create = (model: Model, config: Config): Factory => {

    const createClassificationPrompt = async (transcription: string): Promise<Prompt> => {
        const persona = await Persona.create("classifier", config.configDirectory, DEFAULT_PERSONA_CLASSIFIER_FILE, config.overrides);
        const instructions = await Instructions.create("classify", config.configDirectory, DEFAULT_INSTRUCTIONS_CLASSIFY_FILE, config.overrides);
        const content = createSection("Content");
        content.add(transcription);

        const context = createSection("Context");
        const contextSections = await Context.loadContextFromDirectories(config.contextDirectories);
        contextSections.forEach((section) => {
            context.add(section);
        });

        const prompt = createPrompt(persona, content, context, instructions);
        return prompt;
    };

    const createComposePrompt = async (transcription: ClassifiedTranscription, noteType: string): Promise<Prompt> => {
        const persona = await Persona.create("you", config.configDirectory, DEFAULT_PERSONA_YOU_FILE, config.overrides);
        const instructions = await Instructions.create("compose", config.configDirectory, DEFAULT_INSTRUCTIONS_COMPOSE_FILE, config.overrides);
        const typeInstructions = await Instructions.create("types/" + noteType, config.configDirectory, DEFAULT_TYPE_INSTRUCTIONS_DIR + `/${noteType}.md`, config.overrides);
        instructions.append(typeInstructions);

        const content = createSection("Content");
        content.add(stringifyJSON(transcription));

        const context = createSection("Context");

        const contextSections = await Context.loadContextFromDirectories(config.contextDirectories);
        contextSections.forEach((section) => {
            context.add(section);
        });

        const prompt = createPrompt(persona, content, context, instructions);
        return prompt;
    }

    return {
        createClassificationPrompt,
        createComposePrompt,
    };
}

