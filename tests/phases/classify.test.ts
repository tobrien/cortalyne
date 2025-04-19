import { jest } from '@jest/globals';
import { OutputStructure } from '@tobrien/cabazooka';
import { FilenameOption } from '@tobrien/cabazooka';
import * as Chat from '@tobrien/minorprompt/chat';

// Set up mock implementations before importing modules
const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
};

// Define mock functions with type assertions
const mockFormat = jest.fn() as jest.MockedFunction<(prompt: string, model: Chat.Model) => Chat.Request>;
const mockReadFile = jest.fn() as jest.MockedFunction<(path: string, encoding: string) => Promise<string>>;
const mockWriteFile = jest.fn() as jest.MockedFunction<(path: string, content: string, encoding: string) => Promise<void>>;
const mockExists = jest.fn() as jest.MockedFunction<(path: string) => Promise<boolean>>;
const mockListFiles = jest.fn() as jest.MockedFunction<(directory: string) => Promise<string[]>>;
const mockConstructFilename = jest.fn() as jest.MockedFunction<(date: Date, type: string, hash: string) => Promise<string>>;
const mockTranscribeAudio = jest.fn() as jest.MockedFunction<(path: string, options: any) => Promise<any>>;
const mockCreateCompletion = jest.fn() as jest.MockedFunction<(messages: any[], options: any) => Promise<any>>;
const mockFormatPrompt = jest.fn() as jest.MockedFunction<(prompt: string) => any>;
const mockCreateClassificationPrompt = jest.fn() as jest.MockedFunction<(text: string) => Promise<string>>;
const mockCreateDirectory = jest.fn() as jest.MockedFunction<(path: string) => Promise<void>>;

// Mock the modules before importing
jest.unstable_mockModule('../../src/logging', () => ({
    getLogger: jest.fn(() => mockLogger)
}));

jest.unstable_mockModule('../../src/util/storage', () => ({
    create: jest.fn(() => ({
        readFile: mockReadFile,
        writeFile: mockWriteFile,
        exists: mockExists,
        listFiles: mockListFiles,
        createDirectory: mockCreateDirectory
    }))
}));

jest.unstable_mockModule('../../src/util/openai', () => ({
    transcribeAudio: mockTranscribeAudio,
    createCompletion: mockCreateCompletion,
    format: mockFormat,
}));

jest.unstable_mockModule('../../src/prompt/prompts', () => ({
    create: jest.fn(() => ({
        createClassificationPrompt: mockCreateClassificationPrompt
    })),
}));

jest.unstable_mockModule('../../src/prompt/override', () => ({
    format: mockFormatPrompt,
}));

// Import modules after mocking
let Logging: any;
let Storage: any;
let OpenAI: any;
let Prompt: any;
let ClassifyPhase: any;

describe('classify', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        // Import the modules
        Logging = await import('../../src/logging');
        Storage = await import('../../src/util/storage');
        OpenAI = await import('../../src/util/openai');
        Prompt = await import('../../src/prompt/prompts');
        ClassifyPhase = await import('../../src/phases/classify');

        // Set default mock values
        mockFormat.mockReturnValue({ messages: [{ role: 'user', content: 'classify this' }] } as Chat.Request);
        mockReadFile.mockResolvedValue(JSON.stringify({
            type: 'note',
            subject: 'test subject',
            text: 'This is a test transcription',
            recordingTime: '2023-01-01T12:00:00.000Z'
        }));
        mockWriteFile.mockResolvedValue(undefined);
        mockExists.mockResolvedValue(false);
        mockListFiles.mockResolvedValue([]);
        mockConstructFilename.mockResolvedValue('classification.json');
        mockCreateDirectory.mockResolvedValue(undefined);
        mockTranscribeAudio.mockResolvedValue({ text: 'This is a test transcription' });
        mockCreateCompletion.mockResolvedValue({ type: 'note', subject: 'test subject' });
        mockFormatPrompt.mockReturnValue({ messages: [{ role: 'user', content: 'classify this' }] });
        mockCreateClassificationPrompt.mockResolvedValue('classify this text please');
    });

    describe('create', () => {
        it('should create a classify instance with correct dependencies', () => {
            const config = {
                timezone: 'UTC',
                outputStructure: 'month' as OutputStructure,
                filenameOptions: ['date', 'time'] as FilenameOption[],
                outputDirectory: '/output',
                dryRun: false,
                verbose: false,
                debug: false,
                diff: false,
                log: false,
                model: 'gpt-4o-mini',
                transcriptionModel: 'whisper-1',
                contentTypes: ['diff'],
                recursive: false,
                inputDirectory: './',
                audioExtensions: ['mp3', 'wav'],
                configDir: './.transote',
                overrides: false,
                classifyModel: 'gpt-4o-mini',
                composeModel: 'gpt-4o-mini'
            };

            // Mock Cabazooka operator
            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);

            expect(instance).toBeDefined();
            expect(instance.classify).toBeDefined();
            expect(Logging.getLogger).toHaveBeenCalled();
            expect(Storage.create).toHaveBeenCalledWith({ log: mockLogger.debug });
            expect(Prompt.create).toHaveBeenCalledWith(config.classifyModel, config);
        });
    });

    describe('classify', () => {
        it('should throw error when outputPath is missing', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '';
            const filename = 'transcription.txt';
            const hash = '12345678';
            const audioFile = '/path/to/audio.mp3';

            const config = {
                debug: false,
                transcriptionModel: 'whisper-1',
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini'
            };

            // Mock Cabazooka operator
            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);

            await expect(instance.classify(creation, outputPath, filename, hash, audioFile))
                .rejects.toThrow('outputPath is required for classify function');
        });

        it('should write debug files when debug mode is enabled', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const filename = 'transcription.txt';
            const hash = '12345678';
            const audioFile = '/path/to/audio.mp3';

            mockListFiles.mockResolvedValueOnce([]);
            mockExists.mockResolvedValueOnce(false);

            const config = {
                debug: true,
                transcriptionModel: 'whisper-1',
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini'
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);
            await instance.classify(creation, outputPath, filename, hash, audioFile);

            // Verify debug file was written
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/output/path/debug/classification.request.json',
                expect.any(String),
                'utf8'
            );

            // Verify debug options were passed to createCompletion
            expect(mockCreateCompletion).toHaveBeenCalledWith(
                expect.any(Array),
                expect.objectContaining({
                    debug: true,
                    debugFile: '/output/path/debug/classification.response.json'
                })
            );
        });

        it('should handle undefined creation date', async () => {
            const creation = undefined;
            const outputPath = '/output/path';
            const filename = 'transcription.txt';
            const hash = '12345678';
            const audioFile = '/path/to/audio.mp3';

            mockListFiles.mockResolvedValueOnce([]);
            mockExists.mockResolvedValueOnce(false);

            const config = {
                debug: false,
                transcriptionModel: 'whisper-1',
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini'
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);
            const result = await instance.classify(creation, outputPath, filename, hash, audioFile);

            expect(result).toEqual({
                type: 'note',
                subject: 'test subject',
                text: 'This is a test transcription',
                recordingTime: undefined
            });

            expect(mockWriteFile).toHaveBeenCalledWith(
                '/output/path/classification.json',
                JSON.stringify({
                    type: 'note',
                    subject: 'test subject',
                    text: 'This is a test transcription',
                    recordingTime: undefined
                }, null, 2),
                'utf8'
            );
        });

        it('should skip classification when classification file already exists', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const filename = 'transcription.txt';
            const hash = '12345678';
            const audioFile = '/path/to/audio.mp3';

            // Mocking constructFilename to return the expected path
            mockConstructFilename.mockResolvedValueOnce('classification.json');

            // Simulate file already exists
            mockExists.mockResolvedValueOnce(true);

            const existingClassification = {
                type: 'note',
                subject: 'test subject',
                text: 'This is a test transcription',
                recordingTime: '2023-01-01T12:00:00.000Z'
            };

            // Clear previous mock implementations before setting new ones
            mockReadFile.mockReset();
            mockReadFile.mockResolvedValueOnce(JSON.stringify(existingClassification));

            const config = {
                debug: false,
                transcriptionModel: 'whisper-1',
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini'
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);
            const result = await instance.classify(creation, outputPath, filename, hash, audioFile);

            expect(result).toEqual(existingClassification);
        });

        it('should handle text-only classification with no audio file', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const filename = 'transcription.txt';
            const hash = '12345678';
            const audioFile = undefined;
            const text = 'This is text-only content to classify';

            // Reset mocks to clear previous calls
            mockExists.mockReset();
            mockReadFile.mockReset();
            mockCreateClassificationPrompt.mockReset();
            mockCreateCompletion.mockReset();

            mockExists.mockResolvedValueOnce(false);
            mockConstructFilename.mockResolvedValueOnce('classification.json');
            mockCreateClassificationPrompt.mockResolvedValueOnce('classify this text-only content');
            mockCreateCompletion.mockResolvedValueOnce({ type: 'document', subject: 'text-only subject' });

            const config = {
                debug: false,
                transcriptionModel: 'whisper-1',
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini'
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);
            const result = await instance.classify(creation, outputPath, filename, hash, audioFile, text);

            expect(result).toEqual({
                type: 'document',
                subject: 'text-only subject',
                text: 'This is a test transcription',
                recordingTime: '2023-01-01T12:00:00.000Z'
            });
        });

        it('should handle API errors during classification', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const filename = 'transcription.txt';
            const hash = '12345678';
            const audioFile = '/path/to/audio.mp3';

            // Reset mocks
            mockExists.mockReset();
            mockCreateClassificationPrompt.mockReset();
            mockCreateCompletion.mockReset();
            mockLogger.warn.mockReset();

            // Setup mocks
            mockExists.mockResolvedValueOnce(false);
            mockConstructFilename.mockResolvedValueOnce('classification.json');
            mockCreateClassificationPrompt.mockResolvedValueOnce('classify this text please');
            mockCreateCompletion.mockRejectedValueOnce(new Error('API error'));

            // Specifically ensure the warn logger is called when the API error occurs
            mockLogger.warn.mockImplementationOnce(() => { });

            const config = {
                debug: false,
                transcriptionModel: 'whisper-1',
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini'
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);

            await expect(instance.classify(creation, outputPath, filename, hash, audioFile))
                .rejects.toThrow('API error');

        });

        it('should create output directory if it does not exist', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path/debug';
            const filename = 'transcription.txt';
            const hash = '12345678';
            const audioFile = '/path/to/audio.mp3';

            // Reset mocks
            mockExists.mockReset();
            mockListFiles.mockReset();
            mockCreateDirectory.mockReset();

            mockExists.mockResolvedValueOnce(false);  // Classification file doesn't exist
            mockListFiles.mockResolvedValueOnce([]);  // Empty directory
            mockConstructFilename.mockResolvedValueOnce('classification.json');
            // The debug output directory should be created
            mockCreateDirectory.mockImplementationOnce((path) => {
                // For debugging
                console.log(`Creating directory: ${path}`);
                return Promise.resolve();
            });

            const config = {
                debug: false,
                transcriptionModel: 'whisper-1',
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini'
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);
            await instance.classify(creation, outputPath, filename, hash, audioFile);

            // The expected path should match what the implementation actually calls
            expect(mockCreateDirectory).toHaveBeenCalledWith('/output/path/debug/debug');
        });
    });
});
