import { Section } from "@tobrien/minorprompt";
import { Instruction } from "@tobrien/minorprompt";
import { createInstruction } from "@tobrien/minorprompt";
import * as fs from 'fs/promises';
import * as path from 'path';
import { DEFAULT_TYPE_INSTRUCTIONS_DIR } from "../../../constants";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const create = async (typeName: string, configDir: string, overrides: boolean, { customize }: { customize: (configDir: string, overrideFile: string, content: string, overrides: boolean) => Promise<string> }): Promise<(Instruction | Section<Instruction>)[]> => {
    const instructions: (Instruction | Section<Instruction>)[] = [];

    const markdownFilePath = path.join(__dirname, `${typeName}.md`);
    const instructionContent = await fs.readFile(markdownFilePath, 'utf-8');

    const overrideContent = await customize(configDir, DEFAULT_TYPE_INSTRUCTIONS_DIR + `/${typeName}.md`, instructionContent, overrides);

    const instruction = createInstruction(overrideContent);
    instructions.push(instruction);

    return instructions;
}