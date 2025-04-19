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
        mockReadFile.mockResolvedValue('{"text": "test transcription", "type": "note", "subject": "test"}');
        mockWriteFile.mockResolvedValue(undefined);
        mockExists.mockResolvedValue(false);
        mockListFiles.mockResolvedValue([]);
        mockConstructFilename.mockResolvedValue('/output/path/classification.json');
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
        it('should return existing classification if file with hash exists', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const filename = 'transcription.txt';
            const hash = '12345678';
            const audioFile = '/path/to/audio.mp3';

            mockListFiles.mockResolvedValueOnce(['file-with-12345678-hash.json']);

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
            const result = await instance.classify(creation, outputPath, filename, hash, audioFile);

            const expectedResult = JSON.parse('{"text": "test transcription", "type": "note", "subject": "test"}');
            expect(result).toEqual(expectedResult);
            expect(mockListFiles).toHaveBeenCalledWith(outputPath);
            expect(mockTranscribeAudio).not.toHaveBeenCalled();
            expect(mockCreateCompletion).not.toHaveBeenCalled();
        });

        it('should process audio file and create new classification when no existing file found', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
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

            // Mock Cabazooka operator
            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);
            const result = await instance.classify(creation, outputPath, filename, hash, audioFile);

            expect(result).toEqual({
                type: 'note',
                subject: 'test subject',
                text: 'This is a test transcription',
                recordingTime: '2023-01-01T12:00:00.000Z'
            });

            expect(mockTranscribeAudio).toHaveBeenCalledWith(audioFile, {
                model: 'whisper-1',
                debug: false,
                debugFile: '/output/path/classification.transcription.response.json'
            });

            expect(mockCreateClassificationPrompt).toHaveBeenCalledWith('This is a test transcription');
            expect(mockFormatPrompt).toHaveBeenCalled();

            expect(mockCreateCompletion).toHaveBeenCalled();
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/output/path/classification.json',
                JSON.stringify({
                    type: 'note',
                    subject: 'test subject',
                    text: 'This is a test transcription',
                    recordingTime: '2023-01-01T12:00:00.000Z'
                }, null, 2),
                'utf8'
            );
        });

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

        it('should return existing classification if file exists at jsonOutputPath', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const filename = 'transcription.txt';
            const hash = '12345678';
            const audioFile = '/path/to/audio.mp3';

            mockListFiles.mockResolvedValueOnce([]);
            mockExists.mockResolvedValueOnce(true);

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

            const expectedResult = JSON.parse('{"text": "test transcription", "type": "note", "subject": "test"}');
            expect(result).toEqual(expectedResult);
            expect(mockReadFile).toHaveBeenCalledWith('/output/path/classification.json', 'utf8');
            expect(mockExists).toHaveBeenCalledWith('/output/path/classification.json');
            expect(mockTranscribeAudio).not.toHaveBeenCalled();
            expect(mockCreateCompletion).not.toHaveBeenCalled();
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
                '/output/path/classification.request.json',
                expect.any(String),
                'utf8'
            );

            // Verify debug options were passed to createCompletion
            expect(mockCreateCompletion).toHaveBeenCalledWith(
                expect.any(Array),
                expect.objectContaining({
                    debug: true,
                    debugFile: '/output/path/classification.response.json'
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
    });
});
