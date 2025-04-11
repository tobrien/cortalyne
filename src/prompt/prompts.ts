import * as MinorPrompt from '@tobrien/minorprompt';
import * as Chat from '@tobrien/minorprompt/chat';
import * as Formatter from '@tobrien/minorprompt/formatter';
import { ClassifiedTranscription } from '../process.d';
import { Config as RunConfig } from '../run.d';
import { stringifyJSON } from '../util/general';
import * as ClassifyInstructions from './instructions/classify';
import * as ComposeInstructions from './instructions/compose';
import * as ClassifyPersona from './persona/classifier';
import * as YouPersona from './persona/you';
import path from 'path';
import { getLogger } from '../logging';
import * as Storage from '../util/storage';
import * as Context from './context';

export interface Factory {
    createClassificationPrompt: (transcription: string) => Promise<MinorPrompt.Instance>;
    createComposePrompt: (transcription: ClassifiedTranscription, noteType: string) => Promise<MinorPrompt.Instance>;
    generateOverrideContent: (configDir: string, overrideFile: string) => Promise<{ override?: string, prepend?: string, append?: string }>;
    customizeContent: (configDir: string, overrideFile: string, content: string) => Promise<string>;
    format: (prompt: MinorPrompt.Instance) => Chat.Request;
}

export const create = (model: Chat.Model, runConfig: RunConfig): Factory => {

    const createClassificationPrompt = async (transcription: string): Promise<MinorPrompt.Instance> => {
        const prompt: MinorPrompt.Instance = MinorPrompt.create();
        // TODO: Passing this function?  It's hateful.  Let's fix this.
        prompt.addPersona(await ClassifyPersona.create(runConfig.configDir, { customizeContent }));
        const instructions = await ClassifyInstructions.create(runConfig.configDir, { generateOverrideContent });
        instructions.forEach((instruction) => {
            prompt.addInstruction(instruction);
        });
        prompt.addContent(transcription);

        const contextSections = await Context.loadContextFromDirectories(runConfig.contextDirectories);
        contextSections.forEach((section) => {
            prompt.addContext(section);
        });

        return prompt;
    };

    const createComposePrompt = async (transcription: ClassifiedTranscription, noteType: string): Promise<MinorPrompt.Instance> => {
        const prompt: MinorPrompt.Instance = MinorPrompt.create();
        prompt.addPersona(await YouPersona.create(runConfig.configDir, { customizeContent }));
        const instructions = await ComposeInstructions.create(noteType, runConfig.configDir, { customizeContent }, runConfig.contextDirectories);
        instructions.forEach((instruction) => {
            prompt.addInstruction(instruction);
        });
        prompt.addContent(stringifyJSON(transcription));

        const contextSections = await Context.loadContextFromDirectories(runConfig.contextDirectories);
        contextSections.forEach((section) => {
            prompt.addContext(section);
        });

        return prompt;
    }

    const format = (prompt: MinorPrompt.Instance): Chat.Request => {
        const formatter = Formatter.create(model);
        return formatter.format(prompt);
    };

    const generateOverrideContent = async (configDir: string, overrideFile: string): Promise<{ override?: string, prepend?: string, append?: string }> => {
        const logger = getLogger();
        const storage = Storage.create({ log: logger.debug });

        const baseFile = path.join(configDir, overrideFile);
        const preFile = baseFile.replace('.md', '-pre.md');
        const postFile = baseFile.replace('.md', '-post.md');

        const response: { override?: string, prepend?: string, append?: string } = {};

        if (await storage.exists(preFile)) {
            logger.debug('Found pre file %s', preFile);
            const customTraits = await storage.readFile(preFile, 'utf8');
            response.prepend = customTraits;
        }

        if (await storage.exists(postFile)) {
            logger.debug('Found post file %s', postFile);
            const customTraits = await storage.readFile(postFile, 'utf8');
            response.append = customTraits;
        }

        if (await storage.exists(baseFile)) {
            logger.debug('Found base file %s', baseFile);
            if (runConfig.overrides) {
                logger.warn('WARNING: Core directives are being overwritten by custom configuration');
                const customTraits = await storage.readFile(baseFile, 'utf8');
                response.override = customTraits;
            } else {
                logger.error('ERROR: Core directives are being overwritten by custom configuration');
                throw new Error('Core directives are being overwritten by custom configuration, but overrides are not enabled.  Please enable --overrides to use this feature.');
            }
        }

        return response;
    }

    const customizeContent = async (configDir: string, overrideFile: string, content: string): Promise<string> => {
        const logger = getLogger();
        const { override, prepend, append } = await generateOverrideContent(configDir, overrideFile);
        let finalTraits = content;

        if (override) {
            if (runConfig.overrides) {
                logger.warn('Override found, replacing content from file %s', override);
                finalTraits = override;
            } else {
                logger.error('ERROR: Core directives are being overwritten by custom configuration');
                throw new Error('Core directives are being overwritten by custom configuration, but overrides are not enabled.  Please enable --overrides to use this feature.');
            }
        }

        if (prepend) {
            logger.debug('Prepend found, adding to content from file %s', prepend);
            finalTraits = prepend + '\n' + finalTraits;
        }

        if (append) {
            logger.debug('Append found, adding to content from file %s', append);
            finalTraits = finalTraits + '\n' + append;
        }

        return finalTraits;
    }

    return {
        createClassificationPrompt,
        createComposePrompt,
        generateOverrideContent,
        customizeContent,
        format,
    };
}

