import { jest } from '@jest/globals';
import { OutputStructure } from '@tobrien/cabazooka';
import { FilenameOption } from '@tobrien/cabazooka';

// Set up mock implementations before importing modules
const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Define mock functions with type assertions
const mockReadFile = jest.fn() as jest.MockedFunction<(path: string, encoding: string) => Promise<string>>;
const mockWriteFile = jest.fn() as jest.MockedFunction<(path: string, content: string, encoding: string) => Promise<void>>;
const mockExists = jest.fn() as jest.MockedFunction<(path: string) => Promise<boolean>>;
const mockListFiles = jest.fn() as jest.MockedFunction<(directory: string) => Promise<string[]>>;
const mockConstructFilename = jest.fn() as jest.MockedFunction<(date: Date, type: string, hash: string) => Promise<string>>;
const mockTranscribeAudio = jest.fn() as jest.MockedFunction<(path: string, options: any) => Promise<any>>;
const mockCreateDirectory = jest.fn() as jest.MockedFunction<(path: string) => Promise<void>>;
const mockGetFileSize = jest.fn() as jest.MockedFunction<(path: string) => Promise<number>>;
const mockDeleteFile = jest.fn() as jest.MockedFunction<(path: string) => Promise<void>>;
const mockSplitAudioFile = jest.fn() as jest.MockedFunction<(filePath: string, outputDir: string, maxSizeBytes: number) => Promise<string[]>>;

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
        createDirectory: mockCreateDirectory,
        getFileSize: mockGetFileSize,
        deleteFile: mockDeleteFile
    }))
}));

jest.unstable_mockModule('../../src/util/openai', () => ({
    transcribeAudio: mockTranscribeAudio,
}));

jest.unstable_mockModule('../../src/util/media', () => ({
    create: jest.fn(() => ({
        getAudioCreationTime: jest.fn(),
        getFileSize: mockGetFileSize,
        splitAudioFile: mockSplitAudioFile
    }))
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
        mockGetFileSize.mockResolvedValue(1000); // Default to small file size
        mockDeleteFile.mockResolvedValue(undefined);
        mockSplitAudioFile.mockResolvedValue(['/tmp/audio_part1.mp3', '/tmp/audio_part2.mp3']);
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

        it('should split large audio files and transcribe each part', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const filename = 'large-audio.mp3';
            const hash = '12345678';
            const audioFile = '/path/to/large-audio.mp3';
            const maxAudioSize = 5000000; // 5MB
            const tempDirectory = '/tmp';

            // Simulate file doesn't exist
            mockExists.mockResolvedValueOnce(false);

            // Simulate large file size
            mockGetFileSize.mockResolvedValueOnce(10000000); // 10MB

            // Mock split audio file
            const splitFiles = [
                '/tmp/large-audio_part1.mp3',
                '/tmp/large-audio_part2.mp3'
            ];
            mockSplitAudioFile.mockResolvedValueOnce(splitFiles);

            // Mock transcription results for each part
            mockTranscribeAudio
                .mockResolvedValueOnce({ text: 'This is part 1 of the transcription.' })
                .mockResolvedValueOnce({ text: 'This is part 2 of the transcription.' });

            const config = {
                debug: false,
                transcriptionModel: 'whisper-1',
                maxAudioSize: maxAudioSize,
                tempDirectory: tempDirectory
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = TranscribePhase.create(config, mockOperator);
            const result = await instance.transcribe(creation, outputPath, filename, hash, audioFile);

            // Verify result is the combined text
            expect(result).toEqual({
                text: 'This is part 1 of the transcription. This is part 2 of the transcription.'
            });

            // Verify file was checked for size
            expect(mockGetFileSize).toHaveBeenCalledWith(audioFile);

            // Verify audio was split
            expect(mockSplitAudioFile).toHaveBeenCalledWith(
                audioFile,
                expect.stringContaining(`${tempDirectory}/split_audio_${hash}`),
                maxAudioSize
            );

            // Verify each split file was transcribed
            expect(mockTranscribeAudio).toHaveBeenCalledTimes(2);
            expect(mockTranscribeAudio).toHaveBeenCalledWith(
                splitFiles[0],
                expect.objectContaining({
                    model: 'whisper-1'
                })
            );
            expect(mockTranscribeAudio).toHaveBeenCalledWith(
                splitFiles[1],
                expect.objectContaining({
                    model: 'whisper-1'
                })
            );

            // Verify temporary files were deleted
            expect(mockDeleteFile).toHaveBeenCalledTimes(2);
            expect(mockDeleteFile).toHaveBeenCalledWith(splitFiles[0]);
            expect(mockDeleteFile).toHaveBeenCalledWith(splitFiles[1]);

            // Verify combined transcription was saved
            expect(mockWriteFile).toHaveBeenCalledWith(
                expect.stringContaining('/output/path/transcript.json'),
                expect.stringContaining('This is part 1 of the transcription. This is part 2 of the transcription.'),
                'utf8'
            );
        });

        it('should save debug data for split files when debug mode is enabled', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const filename = 'large-audio.mp3';
            const hash = '12345678';
            const audioFile = '/path/to/large-audio.mp3';
            const maxAudioSize = 5000000; // 5MB
            const tempDirectory = '/tmp';

            // Simulate file doesn't exist
            mockExists.mockResolvedValueOnce(false);

            // Simulate large file size
            mockGetFileSize.mockResolvedValueOnce(10000000); // 10MB

            // Mock split audio file
            const splitFiles = [
                '/tmp/large-audio_part1.mp3',
                '/tmp/large-audio_part2.mp3'
            ];
            mockSplitAudioFile.mockResolvedValueOnce(splitFiles);

            // Mock transcription results for each part
            const part1Transcription = { text: 'This is part 1 of the transcription.' };
            const part2Transcription = { text: 'This is part 2 of the transcription.' };

            mockTranscribeAudio
                .mockResolvedValueOnce(part1Transcription)
                .mockResolvedValueOnce(part2Transcription);

            const config = {
                debug: true,
                transcriptionModel: 'whisper-1',
                maxAudioSize: maxAudioSize,
                tempDirectory: tempDirectory
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = TranscribePhase.create(config, mockOperator);
            await instance.transcribe(creation, outputPath, filename, hash, audioFile);

            // Verify debug files were written for each chunk
            expect(mockTranscribeAudio).toHaveBeenCalledWith(
                splitFiles[0],
                expect.objectContaining({
                    debug: true,
                    debugFile: expect.stringContaining('transcript.transcription.chunk1.raw.response.json')
                })
            );

            expect(mockTranscribeAudio).toHaveBeenCalledWith(
                splitFiles[1],
                expect.objectContaining({
                    debug: true,
                    debugFile: expect.stringContaining('transcript.transcription.chunk2.raw.response.json')
                })
            );

            // Verify combined debug data was saved
            expect(mockWriteFile).toHaveBeenCalledWith(
                expect.stringContaining('/output/path/debug/transcript.transcription.combined.json'),
                expect.any(String),
                'utf8'
            );

            // Verify temporary files were not deleted in debug mode
            expect(mockDeleteFile).not.toHaveBeenCalled();
        });
    });
}); 