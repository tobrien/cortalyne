import { jest } from '@jest/globals';
import path from 'path';

// Mock the modules before importing
const mockLogger = {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

jest.unstable_mockModule('../../src/logging', () => ({
    getLogger: jest.fn(() => mockLogger)
}));

const mockStorage = {
    exists: jest.fn(),
    readFile: jest.fn()
};

jest.unstable_mockModule('../../src/util/storage', () => ({
    create: jest.fn(() => mockStorage)
}));

// Mock MinorPrompt
const mockFormatter = {
    format: jest.fn()
};

jest.unstable_mockModule('@tobrien/minorprompt', () => ({
    Instance: jest.fn()
}));

jest.unstable_mockModule('@tobrien/minorprompt/chat', () => ({
    Model: jest.fn(),
    Request: jest.fn()
}));

jest.unstable_mockModule('@tobrien/minorprompt/formatter', () => ({
    create: jest.fn(() => mockFormatter)
}));

let Override: any;
let Logging: any;
let Storage: any;
let MinorPrompt: any;
let Chat: any;
let Formatter: any;

describe('override', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        // Import modules after mocking
        Logging = await import('../../src/logging');
        Storage = await import('../../src/util/storage');
        MinorPrompt = await import('@tobrien/minorprompt');
        Chat = await import('@tobrien/minorprompt/chat');
        Formatter = await import('@tobrien/minorprompt/formatter');
        Override = await import('../../src/prompt/override');
    });

    describe('format', () => {
        it('should format the prompt using the formatter', () => {
            // @ts-ignore
            const mockPrompt = {};
            // @ts-ignore
            const mockModel = {};
            // @ts-ignore
            const mockRequest = { messages: [] };

            mockFormatter.format.mockReturnValue(mockRequest);

            const result = Override.format(mockPrompt, mockModel);

            expect(Formatter.create).toHaveBeenCalledWith(mockModel);
            expect(mockFormatter.format).toHaveBeenCalledWith(mockPrompt);
            expect(result).toBe(mockRequest);
        });
    });

    describe('overrideContent', () => {
        it('should return empty object when no files exist', async () => {
            // @ts-ignore
            mockStorage.exists.mockResolvedValue(false);

            const result = await Override.overrideContent('/config', 'test.md', false);

            expect(result).toEqual({});
            expect(Storage.create).toHaveBeenCalledWith({ log: mockLogger.debug });
        });

        it('should load prepend content when pre file exists', async () => {
            // @ts-ignore
            mockStorage.exists.mockImplementation(async (file: string) => {
                return file.endsWith('-pre.md');
            });

            // @ts-ignore
            mockStorage.readFile.mockResolvedValue('prepend content');

            const result = await Override.overrideContent('/config', 'test.md', false);

            expect(result).toEqual({
                prepend: 'prepend content'
            });
            expect(mockLogger.debug).toHaveBeenCalledWith('Found pre file %s', '/config/test-pre.md');
        });

        it('should load append content when post file exists', async () => {
            // @ts-ignore
            mockStorage.exists.mockImplementation(async (file: string) => {
                return file.endsWith('-post.md');
            });

            // @ts-ignore
            mockStorage.readFile.mockResolvedValue('append content');

            const result = await Override.overrideContent('/config', 'test.md', false);

            expect(result).toEqual({
                append: 'append content'
            });
            expect(mockLogger.debug).toHaveBeenCalledWith('Found post file %s', '/config/test-post.md');
        });

        it('should throw error when base file exists but overrides not enabled', async () => {
            // @ts-ignore
            mockStorage.exists.mockImplementation(async (file: string) => {
                return !file.includes('-pre') && !file.includes('-post');
            });

            await expect(Override.overrideContent('/config', 'test.md', false)).rejects.toThrow(
                'Core directives are being overwritten by custom configuration, but overrides are not enabled.  Please enable --overrides to use this feature.'
            );
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should load override content when base file exists and overrides enabled', async () => {
            // @ts-ignore
            mockStorage.exists.mockImplementation(async (file: string) => {
                return !file.includes('-pre') && !file.includes('-post');
            });

            // @ts-ignore
            mockStorage.readFile.mockResolvedValue('override content');

            const result = await Override.overrideContent('/config', 'test.md', true);

            expect(result).toEqual({
                override: 'override content'
            });
            expect(mockLogger.warn).toHaveBeenCalledWith('WARNING: Core directives are being overwritten by custom configuration');
        });
    });

    describe('customize', () => {
        it('should return original content when no override files exist', async () => {
            // @ts-ignore
            mockStorage.exists.mockResolvedValue(false);

            const result = await Override.customize('/config', 'test.md', 'original content', false);

            expect(result).toBe('original content');
        });

        it('should apply overrides when available and enabled', async () => {
            // Set up the storage mocks for the full customize flow
            // @ts-ignore
            mockStorage.exists.mockImplementation(async (file: string) => {
                return true; // all files exist
            });

            // @ts-ignore
            mockStorage.readFile.mockImplementation(async (file: string) => {
                if (file.endsWith('-pre.md')) return 'prepend content';
                if (file.endsWith('-post.md')) return 'append content';
                return 'override content';
            });

            const result = await Override.customize('/config', 'test.md', 'original content', true);

            expect(result).toBe('prepend content\noverride content\nappend content');
            expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('should prepend and append to original content when no override', async () => {
            // @ts-ignore
            mockStorage.exists.mockImplementation(async (file: string) => {
                // Only pre and post files exist, base file doesn't
                return file.endsWith('-pre.md') || file.endsWith('-post.md');
            });

            // @ts-ignore
            mockStorage.readFile.mockImplementation(async (file: string) => {
                if (file.endsWith('-pre.md')) return 'prepend content';
                if (file.endsWith('-post.md')) return 'append content';
                return null;
            });

            const result = await Override.customize('/config', 'test.md', 'original content', false);

            expect(result).toBe('prepend content\noriginal content\nappend content');
        });

        it('should throw error when override exists but not enabled', async () => {
            // @ts-ignore
            mockStorage.exists.mockImplementation(async (file: string) => {
                // Only base file exists
                return !file.includes('-pre') && !file.includes('-post');
            });

            // @ts-ignore
            mockStorage.readFile.mockResolvedValue('override content');

            await expect(Override.customize('/config', 'test.md', 'original content', false)).rejects.toThrow(
                'Core directives are being overwritten by custom configuration, but overrides are not enabled.  Please enable --overrides to use this feature.'
            );
        });
    });
});
