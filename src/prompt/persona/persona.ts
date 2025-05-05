import { Formatter, Instruction, Parser, Section } from "@tobrien/minorprompt";
import path from "path";
import { fileURLToPath } from "url";
import { getLogger } from "../../logging";
import { customize } from "../../prompt/override";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const create = async (
    persona: string,
    configDir: string,
    overrideFile: string,
    overrides: boolean,
): Promise<Section<Instruction>> => {
    const logger = getLogger();

    const defaultInstructionPath = path.join(__dirname, `${persona}.md`);

    let instructions: Section<Instruction> = await Parser.parseFile<Instruction>(defaultInstructionPath);
    instructions = await customize(configDir, overrideFile, instructions, overrides);

    logger.debug('Final %s instructions: %s', persona, Formatter.format(instructions));

    return instructions;
}


