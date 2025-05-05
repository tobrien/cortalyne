import { jest } from '@jest/globals';
import path from 'path';
import fs from 'fs/promises';

// Mock objects and values
const mockLogger = {
    debug: jest.fn(),
};

// @ts-ignore - Simplified types for testing
const mockInstructions = { type: 'section', value: 'mock instructions' };
// @ts-ignore - Simplified types for testing
const mockCustomizedInstructions = { type: 'section', value: 'customized instructions' };

// Mock the modules before importing
jest.unstable_mockModule('../../../src/logging', () => ({
    getLogger: jest.fn(() => mockLogger)
}));

// @ts-ignore - Simplified types for testing
jest.unstable_mockModule('@tobrien/minorprompt', () => ({
    Parser: {
        // @ts-ignore - Simplified types for testing
        parseFile: jest.fn().mockResolvedValue(mockInstructions)
    },
    Formatter: {
        // @ts-ignore - Simplified types for testing
        format: jest.fn().mockReturnValue('formatted instructions')
    }
}));

// @ts-ignore - Simplified types for testing
jest.unstable_mockModule('../../../src/prompt/override', () => ({
    // @ts-ignore - Simplified types for testing
    customize: jest.fn().mockResolvedValue(mockCustomizedInstructions)
}));

// Mock fileURLToPath and path.dirname
jest.unstable_mockModule('url', () => ({
    fileURLToPath: jest.fn().mockReturnValue('/mock/path/persona.ts')
}));

// Import the module under test after all mocks are set up
const importModule = async () => {
    const { create } = await import('../../../src/prompt/persona/persona');
    return { create };
};

describe('create function', () => {
    let mockModules: any;
    let persona: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Dynamically import mocked modules
        // @ts-ignore - Using mocked modules
        const { getLogger } = await import('../../../src/logging');
        // @ts-ignore - Using mocked modules
        const { Parser, Formatter } = await import('@tobrien/minorprompt');
        // @ts-ignore - Using mocked modules
        const { customize } = await import('../../../src/prompt/override');

        mockModules = {
            getLogger,
            Parser,
            Formatter,
            customize
        };

        // Import the module under test
        const imported = await importModule();
        persona = imported.create;
    });

    it('should get logger and parse instructions', async () => {
        // Arrange
        const personaName = 'test-persona';
        const configDir = '/config';
        const overrideFile = 'override.json';
        const overrides = true;

        // Act
        const result = await persona(personaName, configDir, overrideFile, overrides);

        // Assert
        expect(mockModules.getLogger).toHaveBeenCalled();
        expect(mockModules.Parser.parseFile).toHaveBeenCalledWith(expect.stringContaining(`test-persona.md`));
        expect(result).toEqual(mockCustomizedInstructions);
    });

    it('should call customize with correct parameters', async () => {
        // Arrange
        const personaName = 'another-persona';
        const configDir = '/another-config';
        const overrideFile = 'another-override.json';
        const overrides = false;

        // Act
        await persona(personaName, configDir, overrideFile, overrides);

        // Assert
        expect(mockModules.customize).toHaveBeenCalledWith(
            configDir,
            overrideFile,
            mockInstructions,
            overrides
        );
    });

    it('should log the final instructions', async () => {
        // Arrange
        const personaName = 'test-persona';
        const configDir = '/config';
        const overrideFile = 'override.json';
        const overrides = true;

        // Act
        await persona(personaName, configDir, overrideFile, overrides);

        // Assert
        expect(mockLogger.debug).toHaveBeenCalledWith(
            'Final %s instructions: %s',
            personaName,
            'formatted instructions'
        );
    });
});
