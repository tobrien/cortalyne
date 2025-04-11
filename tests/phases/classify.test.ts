import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/logging', () => ({
    getLogger: jest.fn()
}));

jest.unstable_mockModule('../../src/prompt/prompts', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../src/util/storage', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../src/util/openai', () => ({
    transcribeAudio: jest.fn(),
    createCompletion: jest.fn()
}));

let Logging: any;
let Prompts: any;
let Storage: any;
let OpenAI: any;
let Classify: any;

describe('classify', () => {
    let mockLogger: any;
    let mockStorage: any;
    let mockPrompts: any;
    let mockOpenAI: any;
    let classifyInstance: any;

    const mockRunConfig = {
        classifyModel: {
            name: 'test-model',
            maxTokens: 1000,
            temperature: 0.7
        },
        transcriptionModel: 'test-transcription-model',
        debug: false,
        configDir: '/test/config',
        contextDirectories: ['/test/context']
    };

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();

        Logging = await import('../../src/logging');
        Prompts = await import('../../src/prompt/prompts');
        Storage = await import('../../src/util/storage');
        OpenAI = await import('../../src/util/openai');
        Classify = await import('../../src/phases/classify');

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

        // Setup prompts mock
        mockPrompts = {
            createClassificationPrompt: jest.fn(),
            format: jest.fn()
        };
        (Prompts.create as jest.Mock).mockReturnValue(mockPrompts);

        // Setup OpenAI mock
        mockOpenAI = {
            transcribeAudio: jest.fn(),
            createCompletion: jest.fn()
        };
        // @ts-ignore
        (OpenAI.transcribeAudio as jest.Mock).mockResolvedValue({ text: 'test transcription' });
        // @ts-ignore
        (OpenAI.createCompletion as jest.Mock).mockResolvedValue({
            type: 'note',
            subject: 'Test Subject'
        });

        // Create classify instance
        classifyInstance = Classify.create(mockRunConfig as any);
    });

    describe('classify', () => {
        it('should return existing classification if file exists', async () => {
            const creation = new Date();
            const outputPath = '/test/output';
            const filename = 'test.txt';
            const hash = 'test-hash';
            const audioFile = 'test-audio.mp3';

            // Setup storage mock to return existing file
            mockStorage.listFiles.mockResolvedValue([`${hash}.json`]);
            mockStorage.readFile.mockResolvedValue(JSON.stringify({
                type: 'note',
                subject: 'Existing Note'
            }));

            const result = await classifyInstance.classify(creation, outputPath, filename, hash, audioFile);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Transcription ClassificationOutput file %s already exists, returning existing content...',
                `${hash}.json`
            );
            expect(result).toEqual({
                type: 'note',
                subject: 'Existing Note'
            });
        });

        it('should process new audio file and create classification', async () => {
            const creation = new Date();
            const outputPath = '/test/output';
            const filename = 'test.txt';
            const hash = 'test-hash';
            const audioFile = 'test-audio.mp3';

            // Setup storage mock to indicate no existing files
            mockStorage.listFiles.mockResolvedValue([]);
            mockStorage.exists.mockResolvedValue(false);

            // Setup prompts mock
            mockPrompts.createClassificationPrompt.mockResolvedValue({});
            mockPrompts.format.mockReturnValue({
                model: 'test-model',
                messages: []
            });

            const result = await classifyInstance.classify(creation, outputPath, filename, hash, audioFile);

            // Verify transcription was created
            expect(OpenAI.transcribeAudio).toHaveBeenCalledWith(audioFile, {
                model: mockRunConfig.transcriptionModel,
                debug: false,
                debugFile: '/test/output/test.txt.transcription.response.json'
            });

            // Verify classification prompt was created and formatted
            expect(mockPrompts.createClassificationPrompt).toHaveBeenCalledWith('test transcription');
            expect(mockPrompts.format).toHaveBeenCalled();

            // Verify completion was created
            expect(OpenAI.createCompletion).toHaveBeenCalled();

            // Verify result
            expect(result).toEqual({
                type: 'note',
                subject: 'Test Subject',
                text: 'test transcription',
                recordingTime: creation.toISOString()
            });
        });

        it('should throw error if outputPath is missing', async () => {
            const creation = new Date();
            const outputPath = '';
            const filename = 'test.txt';
            const hash = 'test-hash';
            const audioFile = 'test-audio.mp3';

            await expect(classifyInstance.classify(creation, outputPath, filename, hash, audioFile))
                .rejects.toThrow('outputPath is required for classify function');
        });
    });
});
