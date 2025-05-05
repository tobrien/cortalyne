import * as path from 'path';
import { describe, expect, it, beforeEach, jest, afterEach } from '@jest/globals';

// Create mocks
const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

const mockStorage = {
    exists: jest.fn(),
    create: jest.fn()
};

const mockStorageInstance = {
    exists: jest.fn()
};

const mockFormatter = {
    formatPrompt: jest.fn(),
    formatSection: jest.fn()
};

const mockParser = {
    parseFile: jest.fn()
};

// Setup module mocks
// @ts-ignore
jest.unstable_mockModule('../../src/logging', () => ({
    getLogger: jest.fn(() => mockLogger)
}));

// @ts-ignore
jest.unstable_mockModule('../../src/util/storage', () => ({
    create: jest.fn(() => mockStorageInstance)
}));

// @ts-ignore
jest.unstable_mockModule('@tobrien/minorprompt', () => ({
    Formatter: mockFormatter,
    Parser: mockParser
}));

// Import the module under test (after mocks are set up)
let overrideModule: typeof import('../../src/prompt/override');

describe('prompt/override', () => {
    beforeEach(async () => {
        // Reset all mocks
        jest.clearAllMocks();

        // Import the module (after mocks to ensure they're used)
        overrideModule = await import('../../src/prompt/override');
    });

    describe('format', () => {
        it('should call Formatter.formatPrompt with the provided prompt and model', () => {
            const mockPrompt = { sections: [] };
            const mockModel = { name: 'test-model' };

            // @ts-ignore - Simplifying type errors
            overrideModule.format(mockPrompt, mockModel);

            expect(mockFormatter.formatPrompt).toHaveBeenCalledWith(mockModel, mockPrompt);
        });
    });

    describe('overrideContent', () => {
        it('should return an empty object when no override files exist', async () => {
            // @ts-ignore
            mockStorageInstance.exists.mockResolvedValue(false);

            const result = await overrideModule.overrideContent(
                '/config',
                'test.md',
                // @ts-ignore - Simplifying type errors
                { type: 'section' },
                false
            );

            expect(result).toEqual({});
            expect(mockStorageInstance.exists).toHaveBeenCalledTimes(3);
        });

        it('should include prepend section when pre file exists', async () => {
            const mockSection = { type: 'section', content: 'pre content' };
            // @ts-ignore
            mockStorageInstance.exists
                // @ts-ignore
                .mockImplementation(async (file: string) => file.includes('-pre.md'));
            // @ts-ignore
            mockParser.parseFile.mockResolvedValue(mockSection);

            const result = await overrideModule.overrideContent(
                '/config',
                'test.md',
                // @ts-ignore - Simplifying type errors
                { type: 'section' },
                false
            );

            expect(result).toEqual({
                prepend: mockSection
            });
            expect(mockParser.parseFile).toHaveBeenCalledWith('/config/test-pre.md');
        });

        it('should include append section when post file exists', async () => {
            const mockSection = { type: 'section', content: 'post content' };
            mockStorageInstance.exists
                // @ts-ignore
                .mockImplementation(async (file: string) => file.includes('-post.md'));
            // @ts-ignore
            mockParser.parseFile.mockResolvedValue(mockSection);

            const result = await overrideModule.overrideContent(
                '/config',
                'test.md',
                // @ts-ignore - Simplifying type errors
                { type: 'section' },
                false
            );

            expect(result).toEqual({
                append: mockSection
            });
            expect(mockParser.parseFile).toHaveBeenCalledWith('/config/test-post.md');
        });

        it('should throw an error when base file exists but overrides are disabled', async () => {
            // @ts-ignore
            mockStorageInstance.exists
                // @ts-ignore
                .mockImplementation(async (file: string) => !file.includes('-pre.md') && !file.includes('-post.md'));

            await expect(overrideModule.overrideContent(
                '/config',
                'test.md',
                // @ts-ignore - Simplifying type errors
                { type: 'section' },
                false
            )).rejects.toThrow('Core directives are being overwritten by custom configuration');

            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should include override section when base file exists and overrides are enabled', async () => {
            const mockSection = { type: 'section', content: 'override content' };
            mockStorageInstance.exists
                // @ts-ignore
                .mockImplementation(async (file: string) => !file.includes('-pre.md') && !file.includes('-post.md'));
            // @ts-ignore
            mockParser.parseFile.mockResolvedValue(mockSection);

            const result = await overrideModule.overrideContent(
                '/config',
                'test.md',
                // @ts-ignore - Simplifying type errors
                { type: 'section' },
                true
            );

            expect(result).toEqual({
                override: mockSection
            });
            expect(mockLogger.warn).toHaveBeenCalled();
            expect(mockParser.parseFile).toHaveBeenCalledWith('/config/test.md');
        });

        it('should handle all three types of files when they exist', async () => {
            // @ts-ignore
            mockStorageInstance.exists.mockResolvedValue(true);
            mockParser.parseFile
                // @ts-ignore
                .mockImplementation(async (file: string) => {
                    if (file.includes('-pre.md')) return { type: 'section', content: 'pre content' };
                    if (file.includes('-post.md')) return { type: 'section', content: 'post content' };
                    return { type: 'section', content: 'base content' };
                });

            const result = await overrideModule.overrideContent(
                '/config',
                'test.md',
                // @ts-ignore - Simplifying type errors
                { type: 'section' },
                true
            );

            expect(result).toEqual({
                prepend: { type: 'section', content: 'pre content' },
                append: { type: 'section', content: 'post content' },
                override: { type: 'section', content: 'base content' }
            });
        });
    });

    describe('customize', () => {
        it('should return the original section when no override files exist', async () => {
            const originalSection = { type: 'section', prepend: jest.fn(), append: jest.fn() };
            // @ts-ignore
            mockStorageInstance.exists.mockResolvedValue(false);

            // @ts-ignore - Simplifying type errors
            const result = await overrideModule.customize('/config', 'test.md', originalSection, false);

            expect(result).toBe(originalSection);
        });

        it('should replace section with override when overrides are enabled', async () => {
            const originalSection = { type: 'section', prepend: jest.fn(), append: jest.fn() };
            const overrideSection = { type: 'section', content: 'override', prepend: jest.fn(), append: jest.fn() };

            mockStorageInstance.exists
                // @ts-ignore
                .mockImplementation(async (file: string) => !file.includes('-pre.md') && !file.includes('-post.md'));
            // @ts-ignore
            mockParser.parseFile.mockResolvedValue(overrideSection);

            // @ts-ignore - Simplifying type errors
            const result = await overrideModule.customize('/config', 'test.md', originalSection, true);

            expect(result).toBe(overrideSection);
            expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('should prepend content when pre file exists', async () => {
            const originalSection = {
                type: 'section',
                prepend: jest.fn().mockReturnValue({ type: 'section', content: 'combined pre' }),
                append: jest.fn()
            };
            const prependSection = { type: 'section', content: 'pre' };

            mockStorageInstance.exists
                // @ts-ignore
                .mockImplementation(async (file: string) => file.includes('-pre.md'));
            // @ts-ignore
            mockParser.parseFile.mockResolvedValue(prependSection);

            // @ts-ignore - Simplifying type errors
            const result = await overrideModule.customize('/config', 'test.md', originalSection, false);

            expect(originalSection.prepend).toHaveBeenCalledWith(prependSection);
            expect(result).toEqual({ type: 'section', content: 'combined pre' });
        });

        it('should append content when post file exists', async () => {
            const originalSection = {
                type: 'section',
                prepend: jest.fn(),
                append: jest.fn().mockReturnValue({ type: 'section', content: 'combined post' })
            };
            const appendSection = { type: 'section', content: 'post' };

            mockStorageInstance.exists
                // @ts-ignore
                .mockImplementation(async (file: string) => file.includes('-post.md'));
            // @ts-ignore
            mockParser.parseFile.mockResolvedValue(appendSection);

            // @ts-ignore - Simplifying type errors
            const result = await overrideModule.customize('/config', 'test.md', originalSection, false);

            expect(originalSection.append).toHaveBeenCalledWith(appendSection);
            expect(result).toEqual({ type: 'section', content: 'combined post' });
        });
    });
});
