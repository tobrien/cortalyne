import { createPersona, Persona } from "@tobrien/minorprompt";
import { DEFAULT_PERSONA_CLASSIFIER_INSTRUCTIONS_FILE, DEFAULT_PERSONA_CLASSIFIER_TRAITS_FILE } from "../../constants";
import { getLogger } from "../../logging";

const PERSONA_CLASSIFIER_TRAITS: string = `
You are a helpful assistant that will classify the raw text of an audio transcript into a category.

Your job is to make sure that the speaker's notes are categorized correctly, and you will do this by following the rules provided in the instructions.

You will also be provided with examples of how to classify the content.
`;

const PERSONA_CLASSIFIER_INSTRUCTIONS: string = `
Please make sure not to change the meaning of the content by adding unrelated information.

If content in the raw audio transcript isn't clear, you can use the context provided to help you understand the content.
`;

export const create = async (configDir: string, overrides: boolean, { customize }: { customize: (configDir: string, overrideFile: string, content: string, overrides: boolean) => Promise<string> }): Promise<Persona> => {
    const logger = getLogger();
    const finalTraits = await customize(configDir, DEFAULT_PERSONA_CLASSIFIER_TRAITS_FILE, PERSONA_CLASSIFIER_TRAITS, overrides);
    const finalInstructions = await customize(configDir, DEFAULT_PERSONA_CLASSIFIER_INSTRUCTIONS_FILE, PERSONA_CLASSIFIER_INSTRUCTIONS, overrides);

    logger.debug('Final Classifier traits: %s', finalTraits);
    logger.debug('Final Classifier instructions: %s', finalInstructions);

    const persona = createPersona("classifier");
    persona.addTrait(finalTraits);
    persona.addInstruction(finalInstructions);
    return persona;
}


