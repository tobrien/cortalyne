import { jest } from '@jest/globals';
import { OutputStructure } from '@tobrien/cabazooka';
import { FilenameOption } from '@tobrien/cabazooka';

// Set up mock implementations before importing modules
const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
};

// Define mock functions with type assertions
const mockReadFile = jest.fn() as jest.MockedFunction<(path: string, encoding: string) => Promise<string>>;
const mockWriteFile = jest.fn() as jest.MockedFunction<(path: string, content: string, encoding: string) => Promise<void>>;
const mockExists = jest.fn() as jest.MockedFunction<(path: string) => Promise<boolean>>;
const mockListFiles = jest.fn() as jest.MockedFunction<(directory: string) => Promise<string[]>>;
const mockConstructFilename = jest.fn() as jest.MockedFunction<(date: Date, type: string, hash: string) => Promise<string>>;
const mockTranscribeAudio = jest.fn() as jest.MockedFunction<(path: string, options: any) => Promise<any>>;
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
}));

// Import modules after mocking
let Logging: any;
let Storage: any;
let OpenAI: any;
let TranscribePhase: any;

describe('transcribe', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        // Import the modules
        Logging = await import('../../src/logging');
        Storage = await import('../../src/util/storage');
        OpenAI = await import('../../src/util/openai');
        TranscribePhase = await import('../../src/phases/transcribe');

        // Set default mock values
        mockReadFile.mockResolvedValue(JSON.stringify({
            text: 'This is a test transcription'
        }));
        mockWriteFile.mockResolvedValue(undefined);
        mockExists.mockResolvedValue(false);
        mockListFiles.mockResolvedValue([]);
        mockConstructFilename.mockResolvedValue('transcript.json');
        mockCreateDirectory.mockResolvedValue(undefined);
        mockTranscribeAudio.mockResolvedValue({ text: 'This is a test transcription' });
    });

    describe('create', () => {
        it('should create a transcribe instance with correct dependencies', () => {
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

            const instance = TranscribePhase.create(config, mockOperator);

            expect(instance).toBeDefined();
            expect(instance.transcribe).toBeDefined();
            expect(Logging.getLogger).toHaveBeenCalled();
            expect(Storage.create).toHaveBeenCalledWith({ log: mockLogger.debug });
        });
    });

    describe('transcribe', () => {
        it('should throw error when outputPath is missing', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '';
            const filename = 'audio.mp3';
            const hash = '12345678';
            const audioFile = '/path/to/audio.mp3';

            const config = {
                debug: false,
                transcriptionModel: 'whisper-1',
            };

            // Mock Cabazooka operator
            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = TranscribePhase.create(config, mockOperator);

            await expect(instance.transcribe(creation, outputPath, filename, hash, audioFile))
                .rejects.toThrow('outputPath is required for transcribe function');
        });

        it('should throw error when audioFile is missing', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const filename = 'audio.mp3';
            const hash = '12345678';
            const audioFile = undefined;

            const config = {
                debug: false,
                transcriptionModel: 'whisper-1',
            };

            // Mock Cabazooka operator
            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = TranscribePhase.create(config, mockOperator);

            await expect(instance.transcribe(creation, outputPath, filename, hash, audioFile))
                .rejects.toThrow('audioFile is required for transcribe function');
        });

        it('should write debug files when debug mode is enabled', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const filename = 'audio.mp3';
            const hash = '12345678';
            const audioFile = '/path/to/audio.mp3';

            mockExists.mockResolvedValueOnce(false);

            const config = {
                debug: true,
                transcriptionModel: 'whisper-1',
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = TranscribePhase.create(config, mockOperator);
            await instance.transcribe(creation, outputPath, filename, hash, audioFile);

            // Verify transcribeAudio was called with debug options
            expect(mockTranscribeAudio).toHaveBeenCalledWith(
                audioFile,
                expect.objectContaining({
                    model: 'whisper-1',
                    debug: true,
                    debugFile: expect.stringContaining('/output/path/debug/transcript.transcription.raw.response.json')
                })
            );
        });

        it('should return existing transcription when it already exists', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const filename = 'audio.mp3';
            const hash = '12345678';
            const audioFile = '/path/to/audio.mp3';

            // Simulate file already exists
            mockExists.mockResolvedValueOnce(true);

            const existingTranscription = {
                text: 'This is an existing transcription'
            };

            // Clear previous mock implementations before setting new ones
            mockReadFile.mockReset();
            mockReadFile.mockResolvedValueOnce(JSON.stringify(existingTranscription));

            const config = {
                debug: false,
                transcriptionModel: 'whisper-1',
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = TranscribePhase.create(config, mockOperator);
            const result = await instance.transcribe(creation, outputPath, filename, hash, audioFile);

            expect(result).toEqual(existingTranscription);
            expect(mockTranscribeAudio).not.toHaveBeenCalled();
        });

        it('should create transcription and save to file', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const filename = 'audio.mp3';
            const hash = '12345678';
            const audioFile = '/path/to/audio.mp3';

            // Simulate file doesn't exist
            mockExists.mockResolvedValueOnce(false);

            const newTranscription = {
                text: 'This is a new transcription'
            };

            // Mock the transcribeAudio to return our test data
            mockTranscribeAudio.mockResolvedValueOnce(newTranscription);

            const config = {
                debug: false,
                transcriptionModel: 'whisper-1',
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = TranscribePhase.create(config, mockOperator);
            const result = await instance.transcribe(creation, outputPath, filename, hash, audioFile);

            expect(result).toEqual(newTranscription);
            expect(mockTranscribeAudio).toHaveBeenCalledWith(
                audioFile,
                expect.objectContaining({
                    model: 'whisper-1',
                })
            );
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/output/path/transcript.json',
                expect.any(String),
                'utf8'
            );
        });
    });
}); 