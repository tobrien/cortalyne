import { jest } from '@jest/globals';

// Variables to hold dynamically imported modules
let completeModule: any;

// Mock dependencies
const mockLogger = {
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

jest.unstable_mockModule('@/logging', () => ({
    getLogger: jest.fn().mockReturnValue(mockLogger)
}));

// Mock storage
const mockStorage = {
    exists: jest.fn(),
    createDirectory: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    deleteFile: jest.fn()
};

jest.unstable_mockModule('@/util/storage', () => ({
    create: jest.fn().mockReturnValue(mockStorage)
}));

// Load all dynamic imports before tests
beforeAll(async () => {
    completeModule = await import('@/phases/complete');
});

describe('Complete Phase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('complete', () => {
        it('should move audio file to processed directory with correct naming format', async () => {
            // Setup
            const config = {
                processedDirectory: './processed',
                dryRun: false
            };

            // Mock successful file operations
            // @ts-ignore
            mockStorage.exists.mockResolvedValue(true);
            // @ts-ignore
            mockStorage.readFile.mockResolvedValue('file content');
            // @ts-ignore
            mockStorage.writeFile.mockResolvedValue(undefined);
            // @ts-ignore
            mockStorage.deleteFile.mockResolvedValue(undefined);

            // Create instance
            const completePhase = completeModule.create(config);

            // Parameters
            const classifiedType = 'note';
            const subject = 'Test Meeting Notes';
            const hash = 'abcdef123';
            const creationTime = new Date('2023-01-15T14:30:00Z');
            const audioFile = '/path/to/recording.mp3';

            // Execute
            const result = await completePhase.complete(
                classifiedType,
                subject,
                hash,
                creationTime,
                audioFile
            );

            // Expected path based on the formatting logic in the complete phase
            const expectedPath = 'processed/2023-1-15-abcdef123-note-test-meeting-notes.mp3';

            // Verify
            expect(result).toBe(expectedPath);
            expect(mockStorage.readFile).toHaveBeenCalledWith(audioFile, 'binary');
            expect(mockStorage.writeFile).toHaveBeenCalledWith(expectedPath, 'file content', 'binary');
            expect(mockStorage.deleteFile).toHaveBeenCalledWith(audioFile);
            expect(mockLogger.debug).toHaveBeenCalledWith('Completing file processing for %s', audioFile);
            expect(mockLogger.info).toHaveBeenCalledWith('Moved file to %s', expectedPath);
        });

        it('should create processed directory if it does not exist', async () => {
            // Setup
            const config = {
                processedDirectory: './processed',
                dryRun: false
            };

            // Mock directory does not exist
            // @ts-ignore
            mockStorage.exists.mockResolvedValue(false);
            // @ts-ignore
            mockStorage.createDirectory.mockResolvedValue(undefined);
            // @ts-ignore
            mockStorage.readFile.mockResolvedValue('file content');
            // @ts-ignore
            mockStorage.writeFile.mockResolvedValue(undefined);
            // @ts-ignore
            mockStorage.deleteFile.mockResolvedValue(undefined);

            // Create instance
            const completePhase = completeModule.create(config);

            // Execute
            await completePhase.complete(
                'note',
                'Test Subject',
                'hash123',
                new Date('2023-01-15T14:30:00Z'),
                '/path/to/recording.mp3'
            );

            // Verify
            expect(mockStorage.exists).toHaveBeenCalledWith('./processed');
            expect(mockStorage.createDirectory).toHaveBeenCalledWith('./processed');
        });

        it('should skip file movement in dry run mode', async () => {
            // Setup with dry run enabled
            const config = {
                processedDirectory: './processed',
                dryRun: true
            };

            // Create instance
            const completePhase = completeModule.create(config);

            // Original file path
            const audioFile = '/path/to/recording.mp3';

            // Execute
            const result = await completePhase.complete(
                'note',
                'Test Subject',
                'hash123',
                new Date('2023-01-15T14:30:00Z'),
                audioFile
            );

            // Verify
            expect(result).toBe(audioFile); // Should return original path
            expect(mockStorage.exists).not.toHaveBeenCalled();
            expect(mockStorage.createDirectory).not.toHaveBeenCalled();
            expect(mockStorage.readFile).not.toHaveBeenCalled();
            expect(mockStorage.writeFile).not.toHaveBeenCalled();
            expect(mockStorage.deleteFile).not.toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Dry run, skipping file movement for %s', audioFile);
        });
    });
}); 