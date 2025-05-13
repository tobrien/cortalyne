import { jest } from '@jest/globals';
import { ChatCompletionMessageParam } from 'openai/resources';

// Mock Cabazooka module
jest.unstable_mockModule('@tobrien/cabazooka', () => ({
    Operator: {}
}));

// Set up mock implementations before importing modules
const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
};

// Define mock functions with type assertions
// @ts-ignore
const mockReadFile = jest.fn().mockResolvedValue('Existing note content');
// @ts-ignore
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
// @ts-ignore
const mockExists = jest.fn().mockResolvedValue(false);
// @ts-ignore
const mockListFiles = jest.fn().mockResolvedValue([]);
// @ts-ignore
const mockCreateCompletion = jest.fn().mockResolvedValue('Generated note content');
// @ts-ignore
const mockFormat = jest.fn().mockReturnValue({ messages: [{ role: 'user', content: 'compose this' }] });
// @ts-ignore
const mockCreateComposePrompt = jest.fn().mockResolvedValue('compose this transcription please');

// Mock the modules before importing
jest.unstable_mockModule('@/logging', () => ({
    getLogger: jest.fn(() => mockLogger)
}));

jest.unstable_mockModule('@/util/storage', () => ({
    create: jest.fn(() => ({
        readFile: mockReadFile,
        writeFile: mockWriteFile,
        exists: mockExists,
        listFiles: mockListFiles
    }))
}));

jest.unstable_mockModule('@/util/openai', () => ({
    createCompletion: mockCreateCompletion,
}));

jest.unstable_mockModule('@/prompt/prompts', () => ({
    create: jest.fn(() => ({
        format: mockFormat,
        createComposePrompt: mockCreateComposePrompt
    })),
}));

// Import modules after mocking
let Logging: any;
let Storage: any;
let OpenAI: any;
let Prompt: any;
let ComposePhase: any;
// Import these modules to ensure we're using the mocked versions
let Cabazooka: any;

describe('compose', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        // Import the modules
        Logging = await import('@/logging');
        Storage = await import('@/util/storage');
        OpenAI = await import('@/util/openai');
        Prompt = await import('@/prompt/prompts');
        ComposePhase = await import('@/phases/compose');
        Cabazooka = await import('@tobrien/cabazooka');

        // Reset mock values
        // @ts-ignore
        mockReadFile.mockResolvedValue('Existing note content');
        // @ts-ignore
        mockWriteFile.mockResolvedValue(undefined);
        // @ts-ignore
        mockExists.mockResolvedValue(false);
        // @ts-ignore
        mockListFiles.mockResolvedValue([]);
        // @ts-ignore
        mockCreateCompletion.mockResolvedValue('Generated note content');
        // @ts-ignore
        mockFormat.mockReturnValue({ messages: [{ role: 'user', content: 'compose this' }] });
        // @ts-ignore
        mockCreateComposePrompt.mockResolvedValue({
            persona: { items: [{ text: 'Persona' }] },
            instructions: { items: [{ text: 'Instructions' }] },
            contents: { items: [{ text: 'Content' }] },
            contexts: { items: [{ text: 'Context' }] },
        });
    });

    describe('create', () => {
        it('should create a compose instance with correct dependencies', () => {
            const config = {
                timezone: 'UTC',
                outputDirectory: '/output',
                dryRun: false,
                debug: false,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini',
                composeModel: 'gpt-4o-mini'
            };

            // Create a mock operator
            const mockOperator = {};

            const instance = ComposePhase.create(config, mockOperator);

            expect(instance).toBeDefined();
            expect(instance.compose).toBeDefined();
            expect(Logging.getLogger).toHaveBeenCalled();
            expect(Storage.create).toHaveBeenCalledWith({ log: mockLogger.debug });
            expect(Prompt.create).toHaveBeenCalledWith(config.composeModel, config);
        });
    });

    describe('compose', () => {
        it('should return existing note if file with hash exists', async () => {
            const transcription = {
                text: 'This is a test transcription',
                type: 'note',
                subject: 'test subject',
                recordingTime: '2023-01-01T12:00:00.000Z'
            };
            const outputPath = '/output/path';
            const filename = 'note';
            const hash = '12345678';

            // @ts-ignore
            mockListFiles.mockResolvedValueOnce(['note-with-12345678-hash.md']);

            const config = {
                debug: false,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini',
                composeModel: 'gpt-4o-mini'
            };

            // Create a mock operator
            const mockOperator = {};

            const instance = ComposePhase.create(config, mockOperator);
            const result = await instance.compose(transcription, outputPath, filename, hash);

            expect(mockListFiles).toHaveBeenCalledWith(outputPath);
            expect(mockCreateCompletion).not.toHaveBeenCalled();
            expect(mockFormat).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        it('should return existing note content if note file already exists', async () => {
            const transcription = {
                text: 'This is a test transcription',
                type: 'note',
                subject: 'test subject',
                recordingTime: '2023-01-01T12:00:00.000Z'
            };
            const outputPath = '/output/path';
            const filename = 'note';
            const hash = '12345678';

            // @ts-ignore
            mockListFiles.mockResolvedValueOnce([]);
            // @ts-ignore
            mockExists.mockResolvedValueOnce(true);

            const config = {
                debug: false,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini',
                composeModel: 'gpt-4o-mini'
            };

            // Create a mock operator
            const mockOperator = {};

            const instance = ComposePhase.create(config, mockOperator);
            const result = await instance.compose(transcription, outputPath, filename, hash);

            expect(mockExists).toHaveBeenCalledWith('/output/path/note.md');
            expect(mockReadFile).toHaveBeenCalledWith('/output/path/note.md', 'utf8');
            expect(mockCreateCompletion).not.toHaveBeenCalled();
            expect(result).toBe('Existing note content');
        });

        it('should generate a new note when no existing file is found', async () => {
            const transcription = {
                text: 'This is a test transcription',
                type: 'note',
                subject: 'test subject',
                recordingTime: '2023-01-01T12:00:00.000Z'
            };
            const outputPath = '/output/path';
            const filename = 'note';
            const hash = '12345678';

            // @ts-ignore
            mockListFiles.mockResolvedValueOnce([]);
            // @ts-ignore
            mockExists.mockResolvedValueOnce(false);

            const config = {
                debug: false,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini',
                composeModel: 'gpt-4o-mini'
            };

            // Create a mock operator
            const mockOperator = {};

            const instance = ComposePhase.create(config, mockOperator);
            const result = await instance.compose(transcription, outputPath, filename, hash);

            expect(mockListFiles).toHaveBeenCalledWith(outputPath);
            expect(mockExists).toHaveBeenCalledWith('/output/path/note.md');
            expect(mockCreateComposePrompt).toHaveBeenCalledWith(transcription, 'note');
            expect(mockCreateCompletion).toHaveBeenCalled();
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/output/path/note.md',
                Buffer.from('Generated note content', 'utf8'),
                'utf8'
            );
            expect(result).toBe('Generated note content');
        });

        it('should create debug files when debug mode is enabled', async () => {
            const transcription = {
                text: 'This is a test transcription',
                type: 'note',
                subject: 'test subject',
                recordingTime: '2023-01-01T12:00:00.000Z'
            };
            const outputPath = '/output/path';
            const filename = 'note';
            const hash = '12345678';

            // Mock for createDirectory
            // @ts-ignore
            const mockCreateDirectory = jest.fn().mockResolvedValue(undefined);
            // @ts-ignore
            Storage.create.mockReturnValueOnce({
                readFile: mockReadFile,
                writeFile: mockWriteFile,
                exists: mockExists,
                listFiles: mockListFiles,
                createDirectory: mockCreateDirectory
            });

            // @ts-ignore
            mockListFiles.mockResolvedValueOnce([]);
            // @ts-ignore
            mockExists.mockResolvedValueOnce(false);
            // @ts-ignore
            mockFormat.mockReturnValueOnce({
                messages: [{ role: 'user', content: 'compose this' }]
            });

            const config = {
                debug: true,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini',
                composeModel: 'gpt-4o-mini'
            };

            const mockOperator = {};
            const instance = ComposePhase.create(config, mockOperator);
            const result = await instance.compose(transcription, outputPath, filename, hash);

            expect(mockCreateDirectory).toHaveBeenCalledWith('/output/path/debug');
            expect(mockWriteFile).toHaveBeenCalledTimes(2); // One for debug, one for actual note
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/output/path/debug/note.request.json',
                expect.any(String),
                'utf8'
            );
            expect(result).toBe('Generated note content');
        });

        it('should handle error when OpenAI completion fails', async () => {
            const transcription = {
                text: 'This is a test transcription',
                type: 'note',
                subject: 'test subject',
                recordingTime: '2023-01-01T12:00:00.000Z'
            };
            const outputPath = '/output/path';
            const filename = 'note';
            const hash = '12345678';

            // @ts-ignore
            mockListFiles.mockResolvedValueOnce([]);
            // @ts-ignore
            mockExists.mockResolvedValueOnce(false);
            // @ts-ignore
            mockCreateCompletion.mockRejectedValueOnce(new Error('OpenAI API error'));

            const config = {
                debug: false,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini',
                composeModel: 'gpt-4o-mini'
            };

            const mockOperator = {};
            const instance = ComposePhase.create(config, mockOperator);

            await expect(instance.compose(transcription, outputPath, filename, hash))
                .rejects.toThrow('OpenAI API error');

            expect(mockWriteFile).not.toHaveBeenCalled();
        });

        it('should handle different file types in transcription', async () => {
            const transcription = {
                text: 'This is a test transcription',
                type: 'action_item',  // Different type
                subject: 'test subject',
                recordingTime: '2023-01-01T12:00:00.000Z'
            };
            const outputPath = '/output/path';
            const filename = 'action';
            const hash = '12345678';

            // @ts-ignore
            mockListFiles.mockResolvedValueOnce([]);
            // @ts-ignore
            mockExists.mockResolvedValueOnce(false);

            const config = {
                debug: false,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini',
                composeModel: 'gpt-4o-mini'
            };

            const mockOperator = {};
            const instance = ComposePhase.create(config, mockOperator);
            await instance.compose(transcription, outputPath, filename, hash);

            expect(mockCreateComposePrompt).toHaveBeenCalledWith(transcription, 'action_item');
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/output/path/action.md',
                Buffer.from('Generated note content', 'utf8'),
                'utf8'
            );
        });
    });
});
