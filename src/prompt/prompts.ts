import { Builder, Model, Prompt } from '@tobrien/minorprompt';
import { getLogger } from '@/logging';
import path from 'path';
import { ClassifiedTranscription } from 'processor';
import { fileURLToPath } from 'url';
import { DEFAULT_INSTRUCTIONS_CLASSIFY_FILE, DEFAULT_INSTRUCTIONS_COMPOSE_FILE, DEFAULT_PERSONA_CLASSIFIER_FILE, DEFAULT_PERSONA_YOU_FILE, DEFAULT_TYPE_INSTRUCTIONS_DIR } from '@/constants';
import { Config } from '@/cortalyne';
import { stringifyJSON } from '@/util/general';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Factory {
    createClassificationPrompt: (transcription: string) => Promise<Prompt>;
    createComposePrompt: (transcription: ClassifiedTranscription, noteType: string) => Promise<Prompt>;
}

export const create = (model: Model, config: Config): Factory => {

    const logger = getLogger();

    const createClassificationPrompt = async (transcription: string): Promise<Prompt> => {
        let builder: Builder.Instance = Builder.create({ logger, basePath: __dirname, overridePath: config.configDirectory, overrides: config.overrides });
        builder = await builder.addPersonaPath(DEFAULT_PERSONA_CLASSIFIER_FILE);
        builder = await builder.addInstructionPath(DEFAULT_INSTRUCTIONS_CLASSIFY_FILE);
        builder = await builder.addContent(transcription);
        if (config.contextDirectories) {
            builder = await builder.loadContext(config.contextDirectories);
        }

        const prompt = await builder.build();
        return prompt;
    };

    const createComposePrompt = async (transcription: ClassifiedTranscription, noteType: string): Promise<Prompt> => {

        let builder: Builder.Instance = Builder.create({ logger, basePath: __dirname, overridePath: config.configDirectory, overrides: config.overrides });
        builder = await builder.addPersonaPath(DEFAULT_PERSONA_YOU_FILE);
        builder = await builder.addInstructionPath(DEFAULT_INSTRUCTIONS_COMPOSE_FILE);
        builder = await builder.addInstructionPath(DEFAULT_TYPE_INSTRUCTIONS_DIR + `/${noteType}.md`);
        builder = await builder.addContent(stringifyJSON(transcription));
        if (config.contextDirectories) {
            builder = await builder.loadContext(config.contextDirectories);
        }

        const prompt = await builder.build();
        return prompt;
    }

    return {
        createClassificationPrompt,
        createComposePrompt,
    };
}

