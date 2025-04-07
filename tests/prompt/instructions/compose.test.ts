import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/logging', () => ({
    getLogger: jest.fn()
}));

jest.unstable_mockModule('../../../src/util/storage', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../../src/util/openai', () => ({
    createCompletion: jest.fn()
}));

let Logging: any;
let Storage: any;
let OpenAI: any;
let Compose: any;

describe('compose', () => {
    let mockLogger: any;
    let mockStorage: any;
    let mockCreateCompletion: any;

    const mockConfig = {
        composeModel: 'test-model',
        debug: false,
        configDir: '/test/config',
        overrides: false
    };

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();

        Logging = await import('../../../src/logging');
        Storage = await import('../../../src/util/storage');
        OpenAI = await import('../../../src/util/openai');
        Compose = await import('../../../src/phases/compose');

        // Setup logger mock
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn()
        };
        (Logging.getLogger as jest.Mock).mockReturnValue(mockLogger);

        // Setup storage mock
        mockStorage = {
            listFiles: jest.fn(),
            exists: jest.fn(),
            readFile: jest.fn(),
            writeFile: jest.fn()
        };
        (Storage.create as jest.Mock).mockReturnValue(mockStorage);

        // Setup OpenAI mock
        mockCreateCompletion = jest.fn();
        (OpenAI.createCompletion as jest.Mock).mockImplementation(mockCreateCompletion);
    });

    describe('compose', () => {
        it('should skip if note file with hash already exists', async () => {
            const transcription = {
                text: 'test transcription',
                type: 'test',
                categories: ['test'],
                confidence: 0.9,
                summary: 'test summary',
                recordingTime: new Date().toISOString()
            };
            const outputPath = '/test/output';
            const filename = 'test';
            const hash = 'abc123';

            mockStorage.listFiles.mockResolvedValue([`${filename}-${hash}.md`]);

            const composeInstance = Compose.create(mockConfig);
            const result = await composeInstance.compose(transcription, outputPath, filename, hash);

            expect(result).toBeUndefined();
            expect(mockCreateCompletion).not.toHaveBeenCalled();
        });

        it('should return existing content if output file exists', async () => {
            const transcription = {
                text: 'test transcription',
                type: 'test',
                categories: ['test'],
                confidence: 0.9,
                summary: 'test summary',
                recordingTime: new Date().toISOString()
            };
            const outputPath = '/test/output';
            const filename = 'test';
            const hash = 'abc123';
            const existingContent = 'existing note content';

            mockStorage.listFiles.mockResolvedValue([]);
            mockStorage.exists.mockResolvedValue(true);
            mockStorage.readFile.mockResolvedValue(existingContent);

            const composeInstance = Compose.create(mockConfig);
            const result = await composeInstance.compose(transcription, outputPath, filename, hash);

            expect(result).toBe(existingContent);
            expect(mockCreateCompletion).not.toHaveBeenCalled();
        });

        it('should create new note and save it', async () => {
            const transcription = {
                text: 'test transcription',
                type: 'test',
                categories: ['test'],
                confidence: 0.9,
                summary: 'test summary',
                recordingTime: new Date().toISOString()
            };
            const outputPath = '/test/output';
            const filename = 'test';
            const hash = 'abc123';
            const noteCompletion = 'new note content';

            mockStorage.listFiles.mockResolvedValue([]);
            mockStorage.exists.mockResolvedValue(false);
            mockCreateCompletion.mockResolvedValue(noteCompletion);

            const composeInstance = Compose.create(mockConfig);
            const result = await composeInstance.compose(transcription, outputPath, filename, hash);

            expect(result).toBe(noteCompletion);
            expect(mockCreateCompletion).toHaveBeenCalled();
            expect(mockStorage.writeFile).toHaveBeenCalled();
        });

        it('should handle errors during composition', async () => {
            const transcription = {
                text: 'test transcription',
                type: 'test',
                categories: ['test'],
                confidence: 0.9,
                summary: 'test summary',
                recordingTime: new Date().toISOString()
            };
            const outputPath = '/test/output';
            const filename = 'test';
            const hash = 'abc123';
            const error = new Error('Composition failed');

            mockStorage.listFiles.mockResolvedValue([]);
            mockStorage.exists.mockResolvedValue(false);
            mockCreateCompletion.mockRejectedValue(error);

            const composeInstance = Compose.create(mockConfig);

            await expect(composeInstance.compose(transcription, outputPath, filename, hash))
                .rejects
                .toThrow('Composition failed');
        });
    });
});
