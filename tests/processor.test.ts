import { jest } from '@jest/globals';
import { ClassifiedTranscription } from '../src/processor';

// Variables to hold dynamically imported modules
let processorModule: any;

// Mock dependencies
const mockLogger = {
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

jest.unstable_mockModule('../src/logging', () => ({
    getLogger: jest.fn().mockReturnValue(mockLogger)
}));

// Mock for TranscribePhase
// @ts-ignore
const mockTranscribe = jest.fn().mockResolvedValue({
    text: 'Test transcription'
});

const mockTranscribeInstance = {
    transcribe: mockTranscribe
};

jest.unstable_mockModule('../src/phases/transcribe', () => ({
    create: jest.fn().mockReturnValue(mockTranscribeInstance)
}));

// Mock for ClassifyPhase
const mockClassify = jest.fn<() => Promise<ClassifiedTranscription>>().mockResolvedValue({
    text: 'Test transcription',
    type: 'note',
    subject: 'Test subject'
});

const mockClassifyInstance = {
    classify: mockClassify
};

jest.unstable_mockModule('../src/phases/classify', () => ({
    create: jest.fn().mockReturnValue(mockClassifyInstance)
}));

// Mock for ComposePhase
const mockCompose = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

const mockComposeInstance = {
    compose: mockCompose
};

jest.unstable_mockModule('../src/phases/compose', () => ({
    create: jest.fn().mockReturnValue(mockComposeInstance)
}));

// Mock for LocatePhase
const mockLocateResult = {
    creationTime: new Date('2023-01-01T12:00:00Z'),
    outputPath: '/test/output/path',
    transcriptionFilename: 'test-transcription.json',
    hash: 'test-hash-123'
};

const mockLocate = jest.fn<() => Promise<typeof mockLocateResult>>().mockResolvedValue(mockLocateResult);

const mockLocateInstance = {
    locate: mockLocate
};

jest.unstable_mockModule('../src/phases/locate', () => ({
    create: jest.fn().mockReturnValue(mockLocateInstance)
}));

// Mock for CompletePhase
const mockComplete = jest.fn<() => Promise<string>>().mockResolvedValue('/test/processed/2023-1-1-test-hash-123-note-test-subject.mp3');

const mockCompleteInstance = {
    complete: mockComplete
};

jest.unstable_mockModule('../src/phases/complete', () => ({
    create: jest.fn().mockReturnValue(mockCompleteInstance)
}));

// Mock Cabazooka operator
const mockConstructFilename = jest.fn<() => Promise<string>>().mockResolvedValue('test-note-filename.md');

const mockOperator = {
    constructFilename: mockConstructFilename
};

// Config object
const mockConfig = {
    model: 'gpt-4o',
    transcriptionModel: 'whisper-1',
    processedDirectory: './processed',
    dryRun: false
};

// Load all dynamic imports before tests
beforeAll(async () => {
    processorModule = await import('../src/processor.js');
});

describe('Processor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('process', () => {
        it('should process an audio file through all phases', async () => {
            // Create a processor instance
            const processor = processorModule.create(mockConfig, mockOperator);

            // Test file to process
            const testFile = '/path/to/test-audio.mp3';

            // Process the file
            await processor.process(testFile);

            // Verify locate phase was called with correct args
            expect(mockLocate).toHaveBeenCalledWith(testFile);

            // Verify transcribe phase was called with correct args
            expect(mockTranscribe).toHaveBeenCalledWith(
                mockLocateResult.creationTime,
                mockLocateResult.outputPath,
                mockLocateResult.transcriptionFilename,
                mockLocateResult.hash,
                testFile
            );

            // Verify classify phase was called with correct args
            expect(mockClassify).toHaveBeenCalledWith(
                mockLocateResult.creationTime,
                mockLocateResult.outputPath,
                'Test transcription', // text from mockTranscribe
                mockLocateResult.hash
            );

            // Verify constructFilename was called
            expect(mockConstructFilename).toHaveBeenCalledWith(
                mockLocateResult.creationTime,
                'note', // type from mockClassify
                mockLocateResult.hash,
                { subject: 'Test subject' }
            );

            // Verify compose phase was called with correct args
            expect(mockCompose).toHaveBeenCalledWith(
                {
                    text: 'Test transcription',
                    type: 'note',
                    subject: 'Test subject'
                },
                mockLocateResult.outputPath,
                'test-note-filename.md',
                mockLocateResult.hash
            );

            // Verify complete phase was called with correct args
            expect(mockComplete).toHaveBeenCalledWith(
                'note',
                'Test subject',
                mockLocateResult.hash,
                mockLocateResult.creationTime,
                testFile
            );

            // Verify logging
            expect(mockLogger.verbose).toHaveBeenCalledWith('Processing file %s', testFile);
            expect(mockLogger.debug).toHaveBeenCalledWith('Locating file %s', testFile);
            expect(mockLogger.debug).toHaveBeenCalledWith('Transcribing file %s', testFile);
            expect(mockLogger.debug).toHaveBeenCalledWith('Classifying transcription for file %s', testFile);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Composing Note %s in %s',
                'test-note-filename.md',
                mockLocateResult.outputPath
            );
            expect(mockLogger.debug).toHaveBeenCalledWith('Completing processing for %s', testFile);
            expect(mockLogger.info).toHaveBeenCalledWith('Processed file %s', testFile);
        });

        it('should handle errors from locate phase', async () => {
            // Setup locate to throw an error
            const testError = new Error('Locate error');
            mockLocate.mockRejectedValueOnce(testError);

            // Create a processor instance
            const processor = processorModule.create(mockConfig, mockOperator);

            // Process the file and expect it to throw
            await expect(processor.process('/path/to/test-audio.mp3')).rejects.toThrow('Locate error');

            // Verify other phases were not called
            expect(mockTranscribe).not.toHaveBeenCalled();
            expect(mockClassify).not.toHaveBeenCalled();
            expect(mockConstructFilename).not.toHaveBeenCalled();
            expect(mockCompose).not.toHaveBeenCalled();
        });

        it('should handle errors from transcribe phase', async () => {
            // Setup transcribe to throw an error
            const testError = new Error('Transcribe error');
            // @ts-ignore
            mockTranscribe.mockRejectedValueOnce(testError);

            // Create a processor instance
            const processor = processorModule.create(mockConfig, mockOperator);

            // Process the file and expect it to throw
            await expect(processor.process('/path/to/test-audio.mp3')).rejects.toThrow('Transcribe error');

            // Verify locate was called but classify and compose were not
            expect(mockLocate).toHaveBeenCalled();
            expect(mockClassify).not.toHaveBeenCalled();
            expect(mockConstructFilename).not.toHaveBeenCalled();
            expect(mockCompose).not.toHaveBeenCalled();
        });

        it('should handle errors from classify phase', async () => {
            // Setup classify to throw an error
            const testError = new Error('Classify error');
            mockClassify.mockRejectedValueOnce(testError);

            // Create a processor instance
            const processor = processorModule.create(mockConfig, mockOperator);

            // Process the file and expect it to throw
            await expect(processor.process('/path/to/test-audio.mp3')).rejects.toThrow('Classify error');

            // Verify locate and transcribe were called but compose was not
            expect(mockLocate).toHaveBeenCalled();
            expect(mockTranscribe).toHaveBeenCalled();
            expect(mockConstructFilename).not.toHaveBeenCalled();
            expect(mockCompose).not.toHaveBeenCalled();
        });

        it('should handle errors from compose phase', async () => {
            // Setup compose to throw an error
            const testError = new Error('Compose error');
            mockCompose.mockRejectedValueOnce(testError);

            // Create a processor instance
            const processor = processorModule.create(mockConfig, mockOperator);

            // Process the file and expect it to throw
            await expect(processor.process('/path/to/test-audio.mp3')).rejects.toThrow('Compose error');

            // Verify previous phases were called
            expect(mockLocate).toHaveBeenCalled();
            expect(mockTranscribe).toHaveBeenCalled();
            expect(mockClassify).toHaveBeenCalled();
            expect(mockConstructFilename).toHaveBeenCalled();
        });

        it('should handle errors from complete phase', async () => {
            // Setup complete to throw an error
            const testError = new Error('Complete error');
            mockComplete.mockRejectedValueOnce(testError);

            // Create a processor instance
            const processor = processorModule.create(mockConfig, mockOperator);

            // Process the file and expect it to throw
            await expect(processor.process('/path/to/test-audio.mp3')).rejects.toThrow('Complete error');

            // Verify previous phases were called
            expect(mockLocate).toHaveBeenCalled();
            expect(mockTranscribe).toHaveBeenCalled();
            expect(mockClassify).toHaveBeenCalled();
            expect(mockConstructFilename).toHaveBeenCalled();
            expect(mockCompose).toHaveBeenCalled();
        });
    });
});
