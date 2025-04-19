import { jest } from '@jest/globals';
import { ChatCompletionMessageParam } from 'openai/resources';

// Mock Chat module before importing
jest.unstable_mockModule('@tobrien/minorprompt/chat', () => ({
    Model: {
        GPT4: 'gpt-4',
        GPT35Turbo: 'gpt-3.5-turbo'
    }
}));

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
jest.unstable_mockModule('../../src/logging', () => ({
    getLogger: jest.fn(() => mockLogger)
}));

jest.unstable_mockModule('../../src/util/storage', () => ({
    create: jest.fn(() => ({
        readFile: mockReadFile,
        writeFile: mockWriteFile,
        exists: mockExists,
        listFiles: mockListFiles
    }))
}));

jest.unstable_mockModule('../../src/util/openai', () => ({
    createCompletion: mockCreateCompletion,
}));

// Mock the @tobrien/minorprompt module
jest.unstable_mockModule('@tobrien/minorprompt', () => ({
    create: jest.fn(() => ({})),
    Instance: {}
}));

jest.unstable_mockModule('../../src/prompt/prompts', () => ({
    create: jest.fn(() => ({
        format: mockFormat,
        createComposePrompt: mockCreateComposePrompt
    })),
}));

jest.unstable_mockModule('../../src/prompt/override', () => ({
    format: mockFormat,
}));

// Import modules after mocking
let Logging: any;
let Storage: any;
let OpenAI: any;
let Prompt: any;
let ComposePhase: any;
// Import these modules to ensure we're using the mocked versions
let Chat: any;
let Cabazooka: any;

describe('compose', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        // Import the modules
        Logging = await import('../../src/logging');
        Storage = await import('../../src/util/storage');
        OpenAI = await import('../../src/util/openai');
        Prompt = await import('../../src/prompt/prompts');
        ComposePhase = await import('../../src/phases/compose');
        Chat = await import('@tobrien/minorprompt/chat');
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
        mockCreateComposePrompt.mockResolvedValue('compose this transcription please');
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

        it('should generate and save new note when no existing note is found', async () => {
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

            expect(mockCreateComposePrompt).toHaveBeenCalledWith(transcription, transcription.type);
            expect(mockFormat).toHaveBeenCalled();
            expect(mockCreateCompletion).toHaveBeenCalledWith(
                [{ role: 'user', content: 'compose this' }],
                {
                    model: 'gpt-4o-mini',
                    debug: false,
                    debugFile: '/output/path/note.response.json'
                }
            );
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/output/path/note.md',
                expect.any(Buffer),
                'utf8'
            );
            expect(result).toBe('Generated note content');
        });

        it('should write debug files when debug mode is enabled', async () => {
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
                debug: true,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini',
                composeModel: 'gpt-4o-mini'
            };

            // Create a mock operator
            const mockOperator = {};

            const instance = ComposePhase.create(config, mockOperator);
            await instance.compose(transcription, outputPath, filename, hash);

            // Verify debug file was written
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/output/path/note.request.json',
                expect.any(String),
                'utf8'
            );

            // Verify debug options were passed to createCompletion
            expect(mockCreateCompletion).toHaveBeenCalledWith(
                expect.any(Array),
                expect.objectContaining({
                    debug: true,
                    debugFile: '/output/path/note.response.json'
                })
            );
        });
    });
});
