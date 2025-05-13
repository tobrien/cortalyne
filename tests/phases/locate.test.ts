import { jest } from '@jest/globals';
import { FilesystemStructure } from '@tobrien/cabazooka';
import { FilenameOption } from '@tobrien/cabazooka';

// Setup mock functions that will be used inside mock modules
const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

const mockGetAudioCreationTime = jest.fn();
const mockHashFile = jest.fn();
const mockNow = jest.fn();
const mockConstructOutputDirectory = jest.fn();
const mockConstructFilename = jest.fn();

// Mock fs and crypto before importing anything that might use them
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        stat: jest.fn(),
        access: jest.fn()
    }
}), { virtual: true });

jest.mock('crypto', () => ({
    createHash: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('12345678abcdef')
    }))
}), { virtual: true });

// Mock modules before importing the code under test
jest.unstable_mockModule('@/logging', () => ({
    getLogger: jest.fn(() => mockLogger)
}));

jest.unstable_mockModule('@/util/media', () => ({
    create: jest.fn(() => ({
        getAudioCreationTime: mockGetAudioCreationTime
    }))
}));

const mockExists = jest.fn();
const mockCreateDirectory = jest.fn();

jest.unstable_mockModule('@/util/storage', () => ({
    create: jest.fn(() => ({
        hashFile: mockHashFile,
        exists: mockExists,
        createDirectory: mockCreateDirectory,
    }))
}));

jest.unstable_mockModule('@/util/dates', () => ({
    create: jest.fn(() => ({
        now: mockNow
    }))
}));

// Now import the module under test
// @ts-ignore
const LocatePhase = await import('@/phases/locate');

describe('locate', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Set up common mock behaviors
        // @ts-ignore
        mockGetAudioCreationTime.mockResolvedValue(new Date('2023-01-01T12:00:00Z'));
        // @ts-ignore
        mockHashFile.mockResolvedValue('12345678abcdef');
        // @ts-ignore
        mockNow.mockReturnValue(new Date('2023-01-01T12:00:00Z'));
        // @ts-ignore
        mockConstructOutputDirectory.mockResolvedValue('/output/path');
        // @ts-ignore
        mockConstructFilename.mockResolvedValue('transcription.txt');
    });

    describe('create', () => {
        it('should create a locate instance with correct dependencies', () => {
            const runConfig = {
                timezone: 'UTC',
                outputStructure: 'month' as FilesystemStructure,
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
                composeModel: 'gpt-4o-mini',
                processedDirectory: './processed'
            };

            // Mock Cabazooka operator
            const mockOperator = {
                constructOutputDirectory: mockConstructOutputDirectory,
                constructFilename: mockConstructFilename,
                // @ts-ignore
                process: jest.fn()
            };

            // @ts-ignore
            const instance = LocatePhase.create(runConfig, mockOperator);
            expect(instance).toBeDefined();
            expect(instance.locate).toBeDefined();
        });
    });

    describe('locate', () => {
        it('should process audio file and return correct metadata', async () => {
            const runConfig = {
                timezone: 'UTC',
                outputStructure: 'month' as FilesystemStructure,
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
                composeModel: 'gpt-4o-mini',
                processedDirectory: './processed'
            };

            // Mock Cabazooka operator
            const mockOperator = {
                constructOutputDirectory: mockConstructOutputDirectory,
                constructFilename: mockConstructFilename,
                // @ts-ignore
                process: jest.fn()
            };

            // @ts-ignore
            const instance = LocatePhase.create(runConfig, mockOperator);
            const result = await instance.locate('/path/to/audio.mp3');

            expect(result).toEqual({
                creationTime: new Date('2023-01-01T12:00:00Z'),
                outputPath: '/output/path',
                contextPath: '/output/path/.context',
                interimPath: '/output/path/.interim',
                transcriptionFilename: 'transcription.txt',
                hash: '12345678',
                audioFile: '/path/to/audio.mp3',
            });

            expect(mockGetAudioCreationTime).toHaveBeenCalledWith('/path/to/audio.mp3');
            expect(mockHashFile).toHaveBeenCalledWith('/path/to/audio.mp3', 100);
            expect(mockConstructOutputDirectory).toHaveBeenCalledWith(new Date('2023-01-01T12:00:00Z'));
            expect(mockConstructFilename).toHaveBeenCalledWith(new Date('2023-01-01T12:00:00Z'), 'transcription', '12345678');
        });

        it('should use current date when creation time cannot be determined', async () => {
            // @ts-ignore
            mockGetAudioCreationTime.mockResolvedValueOnce(null);

            const runConfig = {
                timezone: 'UTC',
                outputStructure: 'month' as FilesystemStructure,
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
                composeModel: 'gpt-4o-mini',
                processedDirectory: './processed'
            };

            // Mock Cabazooka operator
            const mockOperator = {
                constructOutputDirectory: mockConstructOutputDirectory,
                constructFilename: mockConstructFilename,
                // @ts-ignore
                process: jest.fn()
            };

            // @ts-ignore
            const instance = LocatePhase.create(runConfig, mockOperator);

            const result = await instance.locate('/path/to/audio.mp3');

            // Verify the result uses the current date from mockNow
            expect(result.creationTime).toEqual(new Date('2023-01-01T12:00:00Z'));
            expect(result.outputPath).toEqual('/output/path');
            expect(result.transcriptionFilename).toEqual('transcription.txt');
            expect(result.hash).toEqual('12345678');
            expect(result.audioFile).toEqual('/path/to/audio.mp3');

            // Verify the warning was logged
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Could not determine audio recording time for %s, using current date',
                '/path/to/audio.mp3'
            );

            // Verify the mocks were called with correct parameters
            expect(mockGetAudioCreationTime).toHaveBeenCalledWith('/path/to/audio.mp3');
            expect(mockNow).toHaveBeenCalled();
            expect(mockHashFile).toHaveBeenCalledWith('/path/to/audio.mp3', 100);
            expect(mockConstructOutputDirectory).toHaveBeenCalledWith(new Date('2023-01-01T12:00:00Z'));
            expect(mockConstructFilename).toHaveBeenCalledWith(new Date('2023-01-01T12:00:00Z'), 'transcription', '12345678');
        });
    });
});
