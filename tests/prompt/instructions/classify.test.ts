import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/logging', () => ({
    getLogger: jest.fn()
}));

jest.unstable_mockModule('../../../src/util/storage', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../../src/util/openai', () => ({
    transcribeAudio: jest.fn(),
    createCompletion: jest.fn()
}));

let Logging: any;
let Storage: any;
let OpenAI: any;
let Classify: any;

describe('classify', () => {
    let mockLogger: any;
    let mockStorage: any;
    let mockTranscribeAudio: any;
    let mockCreateCompletion: any;

    const mockConfig = {
        classifyModel: 'test-model',
        transcriptionModel: 'whisper-1',
        debug: false,
        configDir: '/test/config',
        overrides: false
    };

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();

        Logging = await import('../../../src/logging');
        Storage = await import('../../../src/util/storage');
        OpenAI = await import('../../../src/util/openai');
        Classify = await import('../../../src/phases/classify');

        // Setup logger mock
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn()
        };
        (Logging.getLogger as jest.Mock).mockReturnValue(mockLogger);

        // Setup storage mock
        mockStorage = {
            listFiles: jest.fn(),
            exists: jest.fn(),
            readFile: jest.fn(),
            writeFile: jest.fn()
        };
        (Storage.create as jest.Mock).mockReturnValue(mockStorage);

        // Setup OpenAI mocks
        mockTranscribeAudio = jest.fn();
        mockCreateCompletion = jest.fn();
        (OpenAI.transcribeAudio as jest.Mock).mockImplementation(mockTranscribeAudio);
        (OpenAI.createCompletion as jest.Mock).mockImplementation(mockCreateCompletion);
    });

    describe('classify', () => {
        it('should return existing classification if file exists', async () => {
            const creation = new Date();
            const outputPath = '/test/output';
            const filename = 'test';
            const hash = 'abc123';
            const audioFile = '/test/audio.mp3';
            const existingContent = { text: 'existing transcription' };

            mockStorage.listFiles.mockResolvedValue([`${filename}-${hash}.json`]);
            mockStorage.readFile.mockResolvedValue(JSON.stringify(existingContent));

            const classifyInstance = Classify.create(mockConfig);
            const result = await classifyInstance.classify(creation, outputPath, filename, hash, audioFile);

            expect(result).toEqual(existingContent);
            expect(mockTranscribeAudio).not.toHaveBeenCalled();
            expect(mockCreateCompletion).not.toHaveBeenCalled();
        });

        it('should process new audio file and save classification', async () => {
            const creation = new Date();
            const outputPath = '/test/output';
            const filename = 'test';
            const hash = 'abc123';
            const audioFile = '/test/audio.mp3';
            const transcription = { text: 'new transcription' };
            const completion = {
                categories: ['test'],
                confidence: 0.9,
                summary: 'test summary'
            };

            mockStorage.listFiles.mockResolvedValue([]);
            mockStorage.exists.mockResolvedValue(false);
            mockTranscribeAudio.mockResolvedValue(transcription);
            mockCreateCompletion.mockResolvedValue(completion);

            const classifyInstance = Classify.create(mockConfig);

            const result = await classifyInstance.classify(creation, outputPath, filename, hash, audioFile);

            expect(result).toEqual({
                ...completion,
                text: transcription.text,
                recordingTime: creation.toISOString()
            });
            expect(mockTranscribeAudio).toHaveBeenCalledWith(audioFile, { model: mockConfig.transcriptionModel, debug: mockConfig.debug, debugFile: '/test/output/test.transcription.response.json' });
            expect(mockCreateCompletion).toHaveBeenCalled();
            expect(mockStorage.writeFile).toHaveBeenCalled();
        });

        it('should handle errors during classification', async () => {
            const creation = new Date();
            const outputPath = '/test/output';
            const filename = 'test';
            const hash = 'abc123';
            const audioFile = '/test/audio.mp3';
            const error = new Error('Transcription failed');

            mockStorage.listFiles.mockResolvedValue([]);
            mockStorage.exists.mockResolvedValue(false);
            mockTranscribeAudio.mockRejectedValue(error);

            const classifyInstance = Classify.create(mockConfig);

            await expect(classifyInstance.classify(creation, outputPath, filename, hash, audioFile))
                .rejects
                .toThrow('Transcription failed');
        });
    });
});
