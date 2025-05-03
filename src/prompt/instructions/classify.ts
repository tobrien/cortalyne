import { Instruction, Section, createInstruction } from "@tobrien/minorprompt";
import * as path from 'path';
import { DEFAULT_INSTRUCTIONS_CLASSIFY_FILE } from "../../constants";
import * as Storage from "../../util/storage";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const create = async (
    configDir: string,
    overrides: boolean,
    { overrideContent }: { overrideContent: (configDir: string, overrideFile: string, overrides: boolean) => Promise<{ override?: string, prepend?: string, append?: string }> }): Promise<(Instruction | Section<Instruction>)[]> => {
    const instructions: (Instruction | Section<Instruction>)[] = [];

    const storage = Storage.create({});
    const content = await overrideContent(configDir, DEFAULT_INSTRUCTIONS_CLASSIFY_FILE, overrides);

    if (content.override) {
        const instruction = createInstruction(content.override);
        instructions.push(instruction);
    } else {
        const defaultInstructionPath = path.join(__dirname, 'classify.md');
        const defaultInstructionContent = await storage.readFile(defaultInstructionPath, 'utf-8');
        const instruction = createInstruction(defaultInstructionContent);
        instructions.push(instruction);
    }

    if (content.prepend) {
        const instruction = createInstruction(content.prepend);
        instructions.unshift(instruction);
    }

    if (content.append) {
        const instruction = createInstruction(content.append);
        instructions.push(instruction);
    }

    return instructions;
}

