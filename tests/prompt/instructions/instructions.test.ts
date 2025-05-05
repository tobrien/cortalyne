import * as path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

// Mock objects
const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Define types for our mocks
type MockInstruction = {
    children: any[];
    add: ReturnType<typeof jest.fn>;
};

// Create mock instructions with types
// @ts-ignore
const mockParsedInstructions: MockInstruction = {
    children: [],
    add: jest.fn()
};

// @ts-ignore
const mockCustomizedInstructions: MockInstruction = {
    children: [],
    add: jest.fn()
};

// Mock the modules before importing
// @ts-ignore - Using unstable_mockModule for ESM mocking
jest.unstable_mockModule('../../../src/logging', () => ({
    getLogger: jest.fn(() => mockLogger)
}));

// @ts-ignore
const mockParseFile = jest.fn().mockResolvedValue(mockParsedInstructions);
const mockFormat = jest.fn().mockReturnValue("formatted instructions");

// @ts-ignore - Using unstable_mockModule for ESM mocking
jest.unstable_mockModule('@tobrien/minorprompt', () => ({
    Parser: {
        parseFile: mockParseFile
    },
    Formatter: {
        format: mockFormat
    }
}));

// @ts-ignore
const mockCustomize = jest.fn().mockResolvedValue(mockCustomizedInstructions);

// @ts-ignore - Using unstable_mockModule for ESM mocking
jest.unstable_mockModule('../../../src/prompt/override', () => ({
    customize: mockCustomize
}));

// Import modules after mocking
let Instructions: any;
let Parser: any;
let Formatter: any;
let override: any;

// Dynamic imports - these need to be imported after mocking
beforeAll(async () => {
    Instructions = await import('../../../src/prompt/instructions/instructions');
    const minorprompt = await import('@tobrien/minorprompt');
    // @ts-ignore
    Parser = minorprompt.Parser;
    // @ts-ignore
    Formatter = minorprompt.Formatter;
    override = await import('../../../src/prompt/override');
});

describe('Instructions Module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('create should parse and customize instructions correctly', async () => {
        // Arrange
        const type = 'system';
        const configDir = '/path/to/config';
        const overrideFile = 'override.md';
        const overrides = true;

        // Act
        const result = await Instructions.create(type, configDir, overrideFile, overrides);

        // Assert
        expect(mockParseFile).toHaveBeenCalledWith(expect.stringContaining(`/${type}.md`));
        expect(result).toBe(mockCustomizedInstructions);
        expect(mockCustomize).toHaveBeenCalledWith(
            configDir,
            overrideFile,
            mockParsedInstructions,
            overrides
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(
            'Final %s instructions: %s',
            type,
            "formatted instructions"
        );
    });

    test('create should use proper file path for instruction type', async () => {
        // Arrange
        const type = 'classify';
        const configDir = '/path/to/config';
        const overrideFile = 'override.md';
        const overrides = false;

        // Act
        await Instructions.create(type, configDir, overrideFile, overrides);

        // Assert
        expect(mockParseFile).toHaveBeenCalledWith(expect.stringContaining(`/${type}.md`));
    });
});
