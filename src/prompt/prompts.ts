import * as MinorPrompt from '@tobrien/minorprompt';
import * as Chat from '@tobrien/minorprompt/chat';
import { ClassifiedTranscription } from 'processor';
import { Config } from '../main';
import { stringifyJSON } from '../util/general';
import * as Context from './context';
import * as ClassifyInstructions from './instructions/classify';
import * as ComposeInstructions from './instructions/compose';
import * as ClassifyPersona from './persona/classifier';
import * as YouPersona from './persona/you';
import * as Override from './override';

export interface Factory {
    createClassificationPrompt: (transcription: string) => Promise<MinorPrompt.Instance>;
    createComposePrompt: (transcription: ClassifiedTranscription, noteType: string) => Promise<MinorPrompt.Instance>;
}

export const create = (model: Chat.Model, config: Config): Factory => {

    const createClassificationPrompt = async (transcription: string): Promise<MinorPrompt.Instance> => {
        const prompt: MinorPrompt.Instance = MinorPrompt.create();
        // TODO: Passing this function?  It's hateful.  Let's fix this.
        prompt.addPersona(await ClassifyPersona.create(config.configDir, config.overrides, { customize: Override.customize }));
        const instructions = await ClassifyInstructions.create(config.configDir, config.overrides, { overrideContent: Override.overrideContent });
        instructions.forEach((instruction) => {
            prompt.addInstruction(instruction);
        });
        prompt.addContent(transcription);

        const contextSections = await Context.loadContextFromDirectories(config.contextDirectories);
        contextSections.forEach((section) => {
            prompt.addContext(section);
        });

        return prompt;
    };

    const createComposePrompt = async (transcription: ClassifiedTranscription, noteType: string): Promise<MinorPrompt.Instance> => {
        const prompt: MinorPrompt.Instance = MinorPrompt.create();
        prompt.addPersona(await YouPersona.create(config.configDir, config.overrides, { customize: Override.customize }));
        const instructions = await ComposeInstructions.create(noteType, config.configDir, config.overrides, { customize: Override.customize });
        instructions.forEach((instruction) => {
            prompt.addInstruction(instruction);
        });
        prompt.addContent(stringifyJSON(transcription));

        const contextSections = await Context.loadContextFromDirectories(config.contextDirectories);
        contextSections.forEach((section) => {
            prompt.addContext(section);
        });

        return prompt;
    }

    return {
        createClassificationPrompt,
        createComposePrompt,
    };
}

