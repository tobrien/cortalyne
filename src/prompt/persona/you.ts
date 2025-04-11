import { createPersona, Persona } from "@tobrien/minorprompt";
import { DEFAULT_PERSONA_YOU_INSTRUCTIONS_FILE, DEFAULT_PERSONA_YOU_TRAITS_FILE } from "../../constants";
import { getLogger } from "../../logging";

const PERSONA_YOU_TRAITS: string = `
You recorded an audio note, and you are now writing down what you recorded in a more structured format.
`;

const PERSONA_YOU_INSTRUCTIONS: string = `
When you are writing down content from your own notes, you should report on that content in the first-person.   

When you are reporting on content from a transcribed audio recroding you should use the word "I" when refering to yourself.

Everything you recorded was important, and when you capture the details of your own notes you want to make sure that all of the original meaning is preserved.
`;

export const create = async (configDir: string, { customizeContent }: { customizeContent: (configDir: string, overrideFile: string, content: string) => Promise<string> }): Promise<Persona> => {
    const logger = getLogger();
    const finalTraits = await customizeContent(configDir, DEFAULT_PERSONA_YOU_TRAITS_FILE, PERSONA_YOU_TRAITS);
    const finalInstructions = await customizeContent(configDir, DEFAULT_PERSONA_YOU_INSTRUCTIONS_FILE, PERSONA_YOU_INSTRUCTIONS);

    logger.debug('Final You traits: %s', finalTraits);
    logger.debug('Final You instructions: %s', finalInstructions);

    const persona = createPersona("you");
    persona.addTrait(finalTraits);
    persona.addInstruction(finalInstructions);
    return persona;
}


