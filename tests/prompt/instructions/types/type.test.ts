'use strict';

import { jest } from '@jest/globals';

import { createInstruction, Instruction, Section } from "@tobrien/minorprompt";
import * as fs from 'fs/promises';
import * as path from 'path';
import { DEFAULT_TYPE_INSTRUCTIONS_DIR } from "../../../../src/constants";

// Mock dependencies before importing the module under test
const mockReadFile = jest.fn();
const mockCustomize = jest.fn();
const mockCreateInstruction = jest.fn();


// @ts-ignore - Use experimental mock module
jest.unstable_mockModule('fs/promises', () => ({
    readFile: mockReadFile,
}));

// Mock minorprompt
// @ts-ignore - Use experimental mock module
jest.unstable_mockModule('@tobrien/minorprompt', () => ({
    createInstruction: mockCreateInstruction,
    // Mock other exports if needed, e.g., Section
    Section: jest.fn(),
    Instruction: jest.fn(),
}));


// Dynamically import the module under test after mocks are set up
let create: (typeName: string, configDir: string, overrides: boolean, { customize }: { customize: (configDir: string, overrideFile: string, content: string, overrides: boolean) => Promise<string> }) => Promise<(Instruction | Section<Instruction>)[]>;

beforeAll(async () => {
    // @ts-ignore - Dynamic import might not be fully recognized
    const module = await import('../../../../src/prompt/instructions/types/type');
    create = module.create;
});

describe('create type instruction', () => {
    const typeName = 'testType';
    const configDir = '/fake/config/dir';
    const markdownContent = '# Test Markdown Content';
    const customizedContent = '# Customized Content';
    const mockInstruction = { type: 'instruction', content: customizedContent };
    const expectedMarkdownPath = `${typeName}.md`;
    const expectedOverridePath = `${DEFAULT_TYPE_INSTRUCTIONS_DIR}/${typeName}.md`;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // @ts-ignore - mock readFile
        mockReadFile.mockResolvedValue(markdownContent);
        // @ts-ignore - mock customize
        mockCustomize.mockResolvedValue(customizedContent);
        // @ts-ignore - mock createInstruction
        mockCreateInstruction.mockReturnValue(mockInstruction);
    });

    it('should read markdown file, customize content, and create instruction when overrides is true', async () => {
        const overrides = true;

        // @ts-ignore - mock create
        const result = await create(typeName, configDir, overrides, { customize: mockCustomize });

        // @ts-ignore - path is mocked
        expect(mockReadFile).toHaveBeenCalledWith(expect.stringContaining(expectedMarkdownPath), 'utf-8');
        expect(mockCustomize).toHaveBeenCalledWith(configDir, expectedOverridePath, markdownContent, overrides);
        expect(mockCreateInstruction).toHaveBeenCalledWith(customizedContent);
        expect(result).toEqual([mockInstruction]);
    });

    it('should read markdown file, customize content, and create instruction when overrides is false', async () => {
        const overrides = false;

        // @ts-ignore - mock create
        const result = await create(typeName, configDir, overrides, { customize: mockCustomize });

        // @ts-ignore - path is mocked
        expect(mockReadFile).toHaveBeenCalledWith(expect.stringContaining(expectedMarkdownPath), 'utf-8');
        expect(mockCustomize).toHaveBeenCalledWith(configDir, expectedOverridePath, markdownContent, overrides);
        expect(mockCreateInstruction).toHaveBeenCalledWith(customizedContent);
        expect(result).toEqual([mockInstruction]);
    });

    it('should handle different typeName correctly', async () => {
        const specificTypeName = 'anotherType';
        const specificMarkdownPath = `${specificTypeName}.md`;
        const specificOverridePath = `${DEFAULT_TYPE_INSTRUCTIONS_DIR}/${specificTypeName}.md`;
        // @ts-ignore - mock path.join

        // @ts-ignore - mock create
        await create(specificTypeName, configDir, true, { customize: mockCustomize });

        // @ts-ignore - path is mocked
        expect(mockReadFile).toHaveBeenCalledWith(expect.stringContaining(specificMarkdownPath), 'utf-8');
        expect(mockCustomize).toHaveBeenCalledWith(configDir, specificOverridePath, markdownContent, true);
    });

    it('should re-throw errors from fs.readFile', async () => {
        const readFileError = new Error('Failed to read file');
        // @ts-ignore - mock readFile
        mockReadFile.mockRejectedValue(readFileError);

        // @ts-ignore - mock create
        await expect(create(typeName, configDir, true, { customize: mockCustomize })).rejects.toThrow(readFileError);
    });

    it('should re-throw errors from customize function', async () => {
        const customizeError = new Error('Customization failed');
        // @ts-ignore - mock customize
        mockCustomize.mockRejectedValue(customizeError);

        // @ts-ignore - mock create
        await expect(create(typeName, configDir, true, { customize: mockCustomize })).rejects.toThrow(customizeError);
    });
});
