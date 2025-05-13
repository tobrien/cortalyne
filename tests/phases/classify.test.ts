import { jest } from '@jest/globals';
import { FilesystemStructure } from '@tobrien/cabazooka';
import { FilenameOption } from '@tobrien/cabazooka';
import { Chat } from '@tobrien/minorprompt';

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
const mockCreateCompletion = jest.fn() as jest.MockedFunction<(messages: any[], options: any) => Promise<any>>;
const mockFormatPrompt = jest.fn() as jest.MockedFunction<(prompt: string) => any>;
const mockCreateClassificationPrompt = jest.fn() as jest.MockedFunction<(text: string) => Promise<string>>;
const mockCreateDirectory = jest.fn() as jest.MockedFunction<(path: string) => Promise<void>>;

// Mock the modules before importing
jest.unstable_mockModule('@/logging', () => ({
    getLogger: jest.fn(() => mockLogger)
}));

jest.unstable_mockModule('@/util/storage', () => ({
    create: jest.fn(() => ({
        readFile: mockReadFile,
        writeFile: mockWriteFile,
        exists: mockExists,
        listFiles: mockListFiles,
        createDirectory: mockCreateDirectory
    }))
}));

jest.unstable_mockModule('@/util/openai', () => ({
    createCompletion: mockCreateCompletion,
    format: mockFormat,
}));

jest.unstable_mockModule('@/prompt/prompts', () => ({
    create: jest.fn(() => ({
        createClassificationPrompt: mockCreateClassificationPrompt
    })),
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
        Logging = await import('@/logging');
        Storage = await import('@/util/storage');
        OpenAI = await import('@/util/openai');
        Prompt = await import('@/prompt/prompts');
        ClassifyPhase = await import('@/phases/classify');

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
        mockCreateCompletion.mockResolvedValue({ type: 'note', subject: 'test subject' });
        mockFormatPrompt.mockReturnValue({ messages: [{ role: 'user', content: 'classify this' }] });
        // @ts-ignore
        mockCreateClassificationPrompt.mockResolvedValue({
            persona: [{ items: [{ text: 'Persona' }] }],
            instructions: [{ items: [{ text: 'Instructions' }] }],
            contents: [{ items: [{ text: 'Content' }] }],
            contexts: [{ items: [{ text: 'Context' }] }],
        });
    });

    describe('create', () => {
        it('should create a classify instance with correct dependencies', () => {
            const config = {
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
            const transcriptionText = 'This is a test transcription';
            const hash = '12345678';

            const config = {
                debug: false,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini'
            };

            // Mock Cabazooka operator
            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);

            await expect(instance.classify(creation, outputPath, transcriptionText, hash))
                .rejects.toThrow('outputPath is required for classify function');
        });

        it('should throw error when transcriptionText is missing', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const transcriptionText = '';
            const hash = '12345678';

            const config = {
                debug: false,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini'
            };

            // Mock Cabazooka operator
            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);

            await expect(instance.classify(creation, outputPath, transcriptionText, hash))
                .rejects.toThrow('transcriptionText is required for classify function');
        });

        it('should handle undefined creation date', async () => {
            const creation = undefined;
            const outputPath = '/output/path';
            const transcriptionText = 'This is a test transcription';
            const hash = '12345678';

            mockListFiles.mockResolvedValueOnce([]);
            mockExists.mockResolvedValueOnce(false);
            // @ts-ignore
            mockCreateClassificationPrompt.mockResolvedValueOnce({
                persona: { items: [{ text: 'Persona' }] },
                instructions: { items: [{ text: 'Instructions' }] },
                contents: { items: [{ text: 'Content' }] },
                contexts: { items: [{ text: 'Context' }] },
            });

            const config = {
                debug: false,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini'
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);
            const result = await instance.classify(creation, outputPath, transcriptionText, hash);

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
            const transcriptionText = 'This is a test transcription';
            const hash = '12345678';

            // Mocking constructFilename to return the expected path
            mockConstructFilename.mockResolvedValueOnce('classification.json');

            // Simulate file already exists
            mockListFiles.mockResolvedValueOnce([`classification_${hash}.json`]);

            const existingClassification = {
                type: 'note',
                subject: 'test subject',
                text: 'This is a test transcription',
                recordingTime: '2023-01-01T12:00:00.000Z'
            };

            // Clear previous mock implementations before setting new ones
            mockReadFile.mockReset();
            mockReadFile.mockResolvedValueOnce(JSON.stringify(existingClassification));
            // @ts-ignore
            mockCreateClassificationPrompt.mockResolvedValueOnce({
                persona: { items: [{ text: 'Persona' }] },
                instructions: { items: [{ text: 'Instructions' }] },
                contents: { items: [{ text: 'Content' }] },
                contexts: { items: [{ text: 'Context' }] },
            });

            const config = {
                debug: false,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini'
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);
            const result = await instance.classify(creation, outputPath, transcriptionText, hash);

            expect(result).toEqual(existingClassification);
        });

        it('should handle API errors during classification', async () => {
            const creation = new Date('2023-01-01T12:00:00Z');
            const outputPath = '/output/path';
            const transcriptionText = 'This is a test transcription';
            const hash = '12345678';

            // Reset mocks
            mockExists.mockReset();
            mockListFiles.mockReset();
            mockCreateClassificationPrompt.mockReset();
            mockCreateCompletion.mockReset();
            mockLogger.warn.mockReset();

            // Setup mocks
            mockListFiles.mockResolvedValueOnce([]);
            mockConstructFilename.mockResolvedValueOnce('classification.json');
            // @ts-ignore
            mockCreateClassificationPrompt.mockResolvedValueOnce({
                persona: { items: [{ text: 'Persona' }] },
                instructions: { items: [{ text: 'Instructions' }] },
                contents: { items: [{ text: 'Content' }] },
                contexts: { items: [{ text: 'Context' }] },
            });
            mockCreateCompletion.mockRejectedValueOnce(new Error('API error'));

            // Specifically ensure the warn logger is called when the API error occurs
            mockLogger.warn.mockImplementationOnce(() => { });

            const config = {
                debug: false,
                model: 'gpt-4o-mini',
                classifyModel: 'gpt-4o-mini'
            };

            const mockOperator = {
                constructFilename: mockConstructFilename
            };

            const instance = ClassifyPhase.create(config, mockOperator);

            await expect(instance.classify(creation, outputPath, transcriptionText, hash))
                .rejects.toThrow('API error');
        });
    });
});
