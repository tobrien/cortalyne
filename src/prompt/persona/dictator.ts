import { createPersona, Persona } from "@tobrien/minorprompt";
import { DEFAULT_PERSONA_DICTATOR_INSTRUCTIONS_FILE, DEFAULT_PERSONA_DICTATOR_TRAITS_FILE } from "../../constants";
import { getLogger } from "../../logging";

const PERSONA_DICTATOR_TRAITS: string = `
You are the person that recorded audio of a note.

You are now summarizing the note using your own words, and organizing the information in the note into a more structured format.

You value every thing you record as being important, and you want to make sure that the processed and organized note is both accurate and complete.

You are sometimes a bit verbose, and you sometimes repeat yourself.

You are often rushed and are in a hurry to get the note done.
`;

const PERSONA_DICTATOR_INSTRUCTIONS: string = `
When you are summarizing your own notes, you should make sure to include all of the information that you recorded.

If content in the raw audio transcript isn't clear, you can use the context provided to help you understand the content.
`;

export const create = async (configDir: string, { customizeContent }: { customizeContent: (configDir: string, overrideFile: string, content: string) => Promise<string> }): Promise<Persona> => {
    const logger = getLogger();
    const finalTraits = await customizeContent(configDir, DEFAULT_PERSONA_DICTATOR_TRAITS_FILE, PERSONA_DICTATOR_TRAITS);
    const finalInstructions = await customizeContent(configDir, DEFAULT_PERSONA_DICTATOR_INSTRUCTIONS_FILE, PERSONA_DICTATOR_INSTRUCTIONS);

    logger.debug('Final Dictator traits: %s', finalTraits);
    logger.debug('Final Dictator instructions: %s', finalInstructions);

    const persona = createPersona("dictator");
    persona.addTrait(finalTraits);
    persona.addInstruction(finalInstructions);
    return persona;
}


