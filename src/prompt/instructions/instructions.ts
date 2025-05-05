import { Formatter, Instruction, Parser, Section } from "@tobrien/minorprompt";
import * as path from 'path';
import { customize } from "../override";
import { fileURLToPath } from 'url';
import { getLogger } from "../../logging";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const create = async (
    type: string,
    configDir: string,
    overrideFile: string,
    overrides: boolean,
): Promise<Section<Instruction>> => {
    const logger = getLogger();
    const defaultInstructionPath = path.join(__dirname, `${type}.md`);

    let instructions: Section<Instruction> = await Parser.parseFile<Instruction>(defaultInstructionPath);
    instructions = await customize(configDir, overrideFile, instructions, overrides);

    logger.debug('Final %s instructions: %s', type, Formatter.format(instructions));

    return instructions;
}

