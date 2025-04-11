import { jest } from '@jest/globals';
import { FilenameOption, OutputStructure } from '../../src/output.d';

// Set up mock implementations before importing modules
const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
};

// Define mock functions with type assertions
const mockGetAudioCreationTime = jest.fn() as jest.MockedFunction<() => Promise<Date | null>>;
const mockHashFile = jest.fn() as jest.MockedFunction<() => Promise<string>>;
const mockConstructOutputDirectory = jest.fn() as jest.MockedFunction<() => string>;
const mockConstructFilename = jest.fn() as jest.MockedFunction<() => string>;

// Mock the modules before importing
jest.unstable_mockModule('../../src/logging', () => ({
    getLogger: jest.fn(() => mockLogger)
}));

jest.unstable_mockModule('../../src/util/media', () => ({
    create: jest.fn(() => ({
        getAudioCreationTime: mockGetAudioCreationTime
    }))
}));

jest.unstable_mockModule('../../src/util/storage', () => ({
    create: jest.fn(() => ({
        hashFile: mockHashFile
    }))
}));

jest.unstable_mockModule('../../src/output', () => ({
    create: jest.fn(() => ({
        constructOutputDirectory: mockConstructOutputDirectory,
        constructFilename: mockConstructFilename
    }))
}));

// Import modules after mocking
let Logging: any;
let Media: any;
let Storage: any;
let Output: any;
let LocatePhase: any;

describe('locate', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        // Import the modules
        Logging = await import('../../src/logging');
        Media = await import('../../src/util/media');
        Storage = await import('../../src/util/storage');
        Output = await import('../../src/output');
        LocatePhase = await import('../../src/phases/locate');

        // Set default mock values
        mockGetAudioCreationTime.mockResolvedValue(new Date('2023-01-01T12:00:00Z'));
        mockHashFile.mockResolvedValue('12345678abcdef');
        mockConstructOutputDirectory.mockReturnValue('/output/path');
        mockConstructFilename.mockReturnValue('transcription.txt');
    });

    describe('create', () => {
        it('should create a locate instance with correct dependencies', () => {
            const runConfig = {
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

            const instance = LocatePhase.create(runConfig);

            expect(instance).toBeDefined();
            expect(instance.locate).toBeDefined();
            expect(Logging.getLogger).toHaveBeenCalled();
            expect(Storage.create).toHaveBeenCalledWith({ log: mockLogger.debug });
            expect(Media.create).toHaveBeenCalledWith(mockLogger);
            expect(Output.create).toHaveBeenCalledWith(
                runConfig.timezone,
                runConfig.outputStructure,
                runConfig.filenameOptions
            );
        });
    });

    describe('locate', () => {
        it('should process audio file and return correct metadata', async () => {
            const runConfig = {
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

            const instance = LocatePhase.create(runConfig);
            const result = await instance.locate('/path/to/audio.mp3');

            expect(result).toEqual({
                creationTime: new Date('2023-01-01T12:00:00Z'),
                outputPath: '/output/path',
                transcriptionFilename: 'transcription.txt',
                hash: '12345678',
                audioFile: '/path/to/audio.mp3',
            });

            expect(mockGetAudioCreationTime).toHaveBeenCalledWith('/path/to/audio.mp3');
            expect(mockHashFile).toHaveBeenCalledWith('/path/to/audio.mp3', 100);
        });

        it('should throw error when creation time cannot be determined', async () => {
            mockGetAudioCreationTime.mockResolvedValueOnce(null);

            const runConfig = {
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

            const instance = LocatePhase.create(runConfig);

            await expect(instance.locate('/path/to/audio.mp3')).rejects.toThrow(
                'Could not determine audio recording time for /path/to/audio.mp3'
            );

            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Could not determine audio recording time for %s, skipping',
                '/path/to/audio.mp3'
            );
        });
    });
});
