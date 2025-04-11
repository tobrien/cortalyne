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
    createCompletion: jest.fn()
}));

let Logging: any;
let Prompts: any;
let Storage: any;
let OpenAI: any;
let Compose: any;

describe('compose', () => {
    let mockLogger: any;
    let mockStorage: any;
    let mockPrompts: any;
    let mockOpenAI: any;
    let composeInstance: any;

    const mockRunConfig = {
        composeModel: {
            name: 'test-model',
            maxTokens: 1000,
            temperature: 0.7
        },
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
        Compose = await import('../../src/phases/compose');

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
            createComposePrompt: jest.fn(),
            format: jest.fn()
        };
        (Prompts.create as jest.Mock).mockReturnValue(mockPrompts);

        // Setup OpenAI mock
        mockOpenAI = {
            createCompletion: jest.fn()
        };
        // @ts-ignore
        (OpenAI.createCompletion as jest.Mock).mockResolvedValue('test note content');

        // Create compose instance
        composeInstance = Compose.create(mockRunConfig as any);
    });

    describe('compose', () => {
        it('should return existing note if file with hash exists', async () => {
            const transcription = {
                type: 'note',
                subject: 'Test Subject'
            };
            const outputPath = '/test/output';
            const filename = 'test-note.md';
            const hash = 'test-hash';

            // Setup storage mock to return existing file
            mockStorage.listFiles.mockResolvedValue([`${hash}.md`]);
            mockStorage.readFile.mockResolvedValue('existing note content');

            const result = await composeInstance.compose(transcription, outputPath, filename, hash);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Transcribed Note file %s already exists, skipping',
                `${hash}.md`
            );
            expect(result).toBeUndefined();
        });

        it('should return existing note if output file exists', async () => {
            const transcription = {
                type: 'note',
                subject: 'Test Subject'
            };
            const outputPath = '/test/output';
            const filename = 'test-note.md';
            const hash = 'test-hash';

            // Setup storage mock to indicate no hash file exists but output file does
            mockStorage.listFiles.mockResolvedValue([]);
            mockStorage.exists.mockResolvedValue(true);
            mockStorage.readFile.mockResolvedValue('existing note content');

            const result = await composeInstance.compose(transcription, outputPath, filename, hash);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Output file %s already exists, returning existing content...',
                '/test/output/test-note.md.md'
            );
            expect(result).toBe('existing note content');
        });

        it('should create new note when no existing files are found', async () => {
            const transcription = {
                type: 'note',
                subject: 'Test Subject'
            };
            const outputPath = '/test/output';
            const filename = 'test-note.md';
            const hash = 'test-hash';

            // Setup storage mock to indicate no existing files
            mockStorage.listFiles.mockResolvedValue([]);
            mockStorage.exists.mockResolvedValue(false);

            // Setup prompts mock
            mockPrompts.createComposePrompt.mockResolvedValue({});
            mockPrompts.format.mockReturnValue({
                model: 'test-model',
                messages: []
            });

            const result = await composeInstance.compose(transcription, outputPath, filename, hash);

            // Verify compose prompt was created and formatted
            expect(mockPrompts.createComposePrompt).toHaveBeenCalledWith(transcription, 'note');
            expect(mockPrompts.format).toHaveBeenCalled();

            // Verify completion was created
            expect(OpenAI.createCompletion).toHaveBeenCalled();

            // Verify file was written
            expect(mockStorage.writeFile).toHaveBeenCalledWith(
                '/test/output/test-note.md.md',
                Buffer.from('test note content', 'utf8'),
                'utf8'
            );

            expect(result).toBe('test note content');
        });

        it('should write debug files when debug is enabled', async () => {
            const transcription = {
                type: 'note',
                subject: 'Test Subject'
            };
            const outputPath = '/test/output';
            const filename = 'test-note.md';
            const hash = 'test-hash';

            // Create compose instance with debug enabled
            composeInstance = Compose.create({ ...mockRunConfig, debug: true } as any);

            // Setup storage mock to indicate no existing files
            mockStorage.listFiles.mockResolvedValue([]);
            mockStorage.exists.mockResolvedValue(false);

            // Setup prompts mock
            mockPrompts.createComposePrompt.mockResolvedValue({});
            mockPrompts.format.mockReturnValue({
                model: 'test-model',
                messages: []
            });

            await composeInstance.compose(transcription, outputPath, filename, hash);

            // Verify debug files were written
            expect(mockStorage.writeFile).toHaveBeenCalledWith(
                '/test/output/test-note.request.json.md',
                expect.any(String),
                'utf8'
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Wrote chat request to %s',
                '/test/output/test-note.request.json.md'
            );
        });
    });
});
