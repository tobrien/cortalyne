import { Instruction, Section, createInstruction } from "@tobrien/minorprompt";
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { DEFAULT_INSTRUCTIONS_COMPOSE_FILE } from "../../constants";
import { create as createStorageUtility } from '../../util/storage';
import { create as createTypeInstructions } from './types/type';

// Derive __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const create = async (type: string, configDir: string, overrides: boolean,
    { customize }: { customize: (configDir: string, overrideFile: string, content: string, overrides: boolean) => Promise<string> },
): Promise<(Instruction | Section<Instruction>)[]> => {
    const instructions: (Instruction | Section<Instruction>)[] = [];

    const storage = createStorageUtility({});
    const instructionsProcessPath = path.join(__dirname, 'compose.md');

    const instructionsProcess = await storage.readFile(instructionsProcessPath, 'utf-8');

    const overrideContent = await customize(configDir, DEFAULT_INSTRUCTIONS_COMPOSE_FILE, instructionsProcess, overrides);

    instructions.push(...await createTypeInstructions(type, configDir, overrides, { customize }));

    const instruction = createInstruction(overrideContent);
    instructions.push(instruction);

    return instructions;
}

