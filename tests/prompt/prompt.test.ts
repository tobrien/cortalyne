import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/util/storage', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../src/logging', () => ({
    getLogger: jest.fn()
}));

let Storage: any;
let Logging: any;
let Prompts: any;

describe('prompts', () => {
    let mockStorage: any;
    let mockLogger: any;
    let promptsInstance: any;

    const mockConfig = {
        configDir: '/test/config',
        overrides: true
    };

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();

        Storage = await import('../../src/util/storage');
        Logging = await import('../../src/logging');
        Prompts = await import('../../src/prompt/prompts');

        // Setup storage mock
        mockStorage = {
            exists: jest.fn(),
            readFile: jest.fn()
        };
        (Storage.create as jest.Mock).mockReturnValue(mockStorage);

        // Setup logger mock
        mockLogger = {
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        (Logging.getLogger as jest.Mock).mockReturnValue(mockLogger);

        // Create prompts instance
        promptsInstance = Prompts.create('test-model', mockConfig);
    });

    describe('generateOverrideContent', () => {
        it('should handle pre and post files correctly', async () => {
            const overrideFile = 'test.md';
            const preContent = 'pre content';
            const postContent = 'post content';

            mockStorage.exists.mockImplementation((path: string) => {
                if (path.includes('-pre.md')) return true;
                if (path.includes('-post.md')) return true;
                return false;
            });

            mockStorage.readFile.mockImplementation((path: string) => {
                if (path.includes('-pre.md')) return preContent;
                if (path.includes('-post.md')) return postContent;
                return '';
            });

            const result = await promptsInstance.generateOverrideContent(mockConfig.configDir, overrideFile);

            expect(result).toEqual({
                prepend: preContent,
                append: postContent
            });
        });

        it('should handle base override file when overrides are enabled', async () => {
            const overrideFile = 'test.md';
            const baseContent = 'base content';

            mockStorage.exists.mockImplementation((path: string) => {
                if (path.includes('.md') && !path.includes('-pre.md') && !path.includes('-post.md')) return true;
                return false;
            });

            mockStorage.readFile.mockResolvedValue(baseContent);

            const result = await promptsInstance.generateOverrideContent(mockConfig.configDir, overrideFile);

            expect(result).toEqual({
                override: baseContent
            });
        });

        it('should throw error when base override file exists but overrides are disabled', async () => {
            const overrideFile = 'test.md';
            const promptsWithoutOverrides = Prompts.create('test-model', { ...mockConfig, overrides: false });

            mockStorage.exists.mockResolvedValue(true);
            mockStorage.readFile.mockResolvedValue('base content');

            await expect(promptsWithoutOverrides.generateOverrideContent(mockConfig.configDir, overrideFile))
                .rejects
                .toThrow('Core directives are being overwritten by custom configuration');
        });
    });

    describe('customizeContent', () => {
        it('should combine prepend and append content correctly', async () => {
            const overrideFile = 'test.md';
            const baseContent = 'base content';
            const preContent = 'pre content';
            const postContent = 'post content';

            mockStorage.exists.mockImplementation((path: string) => {
                if (path.includes('-pre.md')) return true;
                if (path.includes('-post.md')) return true;
                return false;
            });

            mockStorage.readFile.mockImplementation((path: string) => {
                if (path.includes('-pre.md')) return preContent;
                if (path.includes('-post.md')) return postContent;
                return '';
            });

            const result = await promptsInstance.customizeContent(mockConfig.configDir, overrideFile, baseContent);

            expect(result).toBe(`${preContent}\n${baseContent}\n${postContent}`);
        });

        it('should override content when override file exists and overrides are enabled', async () => {
            const overrideFile = 'test.md';
            const baseContent = 'base content';
            const overrideContent = 'override content';

            mockStorage.exists.mockImplementation((path: string) => {
                if (path.includes('.md') && !path.includes('-pre.md') && !path.includes('-post.md')) return true;
                return false;
            });

            mockStorage.readFile.mockResolvedValue(overrideContent);

            const result = await promptsInstance.customizeContent(mockConfig.configDir, overrideFile, baseContent);

            expect(result).toBe(overrideContent);
        });
    });
});
