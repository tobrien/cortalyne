import { jest } from '@jest/globals';

// Increase Jest timeout for all tests in this file
jest.setTimeout(60000);

jest.unstable_mockModule('@tobrien/minorprompt', () => ({
    create: jest.fn().mockReturnValue({
        addPersona: jest.fn(),
        addInstruction: jest.fn(),
        addContent: jest.fn(),
        addContext: jest.fn()
    }),
    Instance: class { }
}));

jest.unstable_mockModule('@tobrien/minorprompt/chat', () => ({
    Model: class { },
    Request: class { }
}));

jest.unstable_mockModule('@tobrien/minorprompt/formatter', () => ({
    create: jest.fn().mockReturnValue({
        format: jest.fn().mockReturnValue({
            model: 'test-model',
            messages: []
        })
    })
}));

jest.unstable_mockModule('../../src/logging', () => ({
    getLogger: jest.fn()
}));

jest.unstable_mockModule('../../src/util/storage', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../src/prompt/context', () => ({
    loadContextFromDirectories: jest.fn()
}));

jest.unstable_mockModule('../../src/prompt/instructions/classify', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../src/prompt/instructions/compose', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../src/prompt/persona/classifier', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../src/prompt/persona/you', () => ({
    create: jest.fn()
}));

let MinorPrompt: any;
let Chat: any;
let Formatter: any;
let Logging: any;
let Storage: any;
let Context: any;
let ClassifyInstructions: any;
let ComposeInstructions: any;
let ClassifyPersona: any;
let YouPersona: any;
let Prompts: any;

describe('Prompts', () => {
    let factory: any;
    let mockModel: any;
    let mockRunConfig: any;
    let mockStorage: any;
    let mockLogger: any;
    let mockPromptInstance: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Import all mocked modules
        MinorPrompt = await import('@tobrien/minorprompt');
        Chat = await import('@tobrien/minorprompt/chat');
        Formatter = await import('@tobrien/minorprompt/formatter');
        Logging = await import('../../src/logging');
        Storage = await import('../../src/util/storage');
        Context = await import('../../src/prompt/context');
        ClassifyInstructions = await import('../../src/prompt/instructions/classify');
        ComposeInstructions = await import('../../src/prompt/instructions/compose');
        ClassifyPersona = await import('../../src/prompt/persona/classifier');
        YouPersona = await import('../../src/prompt/persona/you');
        Prompts = await import('../../src/prompt/prompts');

        // Setup mock model
        mockModel = {
            name: 'test-model',
            maxTokens: 1000,
            temperature: 0.7
        };

        // Setup mock run config
        mockRunConfig = {
            configDir: '/test/config',
            contextDirectories: ['/test/context'],
            overrides: true
        };

        // Setup mock logger
        mockLogger = {
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Setup mock storage
        mockStorage = {
            exists: jest.fn(),
            readFile: jest.fn(),
            writeFile: jest.fn(),
            mkdir: jest.fn(),
            readDir: jest.fn()
        };

        // Setup mock prompt instance
        mockPromptInstance = {
            addPersona: jest.fn(),
            addInstruction: jest.fn(),
            addContent: jest.fn(),
            addContext: jest.fn()
        };

        // Setup logger mock
        (Logging.getLogger as jest.Mock).mockReturnValue(mockLogger);

        // Setup storage mock
        (Storage.create as jest.Mock).mockReturnValue(mockStorage);

        // Setup MinorPrompt mock
        (MinorPrompt.create as jest.Mock).mockReturnValue(mockPromptInstance);

        // Use empty mock implementations with proper return values
        (Context.loadContextFromDirectories as jest.Mock).mockImplementation(() => {
            return Promise.resolve([{ name: 'test-context', content: 'test content' }]);
        });

        (ClassifyPersona.create as jest.Mock).mockImplementation(() => {
            return Promise.resolve({ role: 'classifier' });
        });

        (YouPersona.create as jest.Mock).mockImplementation(() => {
            return Promise.resolve({ role: 'assistant' });
        });

        (ClassifyInstructions.create as jest.Mock).mockImplementation(() => {
            return Promise.resolve([{ text: 'classify instruction' }]);
        });

        (ComposeInstructions.create as jest.Mock).mockImplementation(() => {
            return Promise.resolve([{ text: 'compose instruction' }]);
        });

        // Create factory instance
        factory = Prompts.create(mockModel, mockRunConfig);
    });

    describe('createClassificationPrompt', () => {
        it('should create a classification prompt with transcription', async () => {
            // Setup storage mock for existing files
            mockStorage.exists.mockResolvedValue(false);

            const transcription = 'test transcription';
            const prompt = await factory.createClassificationPrompt(transcription);

            // Verify persona was added
            expect(ClassifyPersona.create).toHaveBeenCalledWith(
                mockRunConfig.configDir,
                expect.objectContaining({ customizeContent: expect.any(Function) })
            );
            expect(mockPromptInstance.addPersona).toHaveBeenCalledWith({ role: 'classifier' });

            // Verify instructions were added
            expect(ClassifyInstructions.create).toHaveBeenCalledWith(
                mockRunConfig.configDir,
                { generateOverrideContent: expect.any(Function) },
            );
            expect(mockPromptInstance.addInstruction).toHaveBeenCalled();

            // Verify content was added
            expect(mockPromptInstance.addContent).toHaveBeenCalledWith(transcription);

            // Verify context was loaded and added
            expect(Context.loadContextFromDirectories).toHaveBeenCalledWith(mockRunConfig.contextDirectories);
            expect(mockPromptInstance.addContext).toHaveBeenCalled();

            expect(prompt).toBe(mockPromptInstance);
        });
    });

    describe('createComposePrompt', () => {
        it('should create a compose prompt with transcription and note type', async () => {
            const transcription = {
                type: 'test',
                content: 'test content'
            };
            const noteType = 'test-note';
            const prompt = await factory.createComposePrompt(transcription, noteType);

            // Verify persona was added
            expect(YouPersona.create).toHaveBeenCalledWith(
                mockRunConfig.configDir,
                expect.objectContaining({ customizeContent: expect.any(Function) })
            );
            expect(mockPromptInstance.addPersona).toHaveBeenCalledWith({ role: 'assistant' });

            // Verify instructions were added
            expect(ComposeInstructions.create).toHaveBeenCalledWith(
                noteType,
                mockRunConfig.configDir,
                expect.objectContaining({ customizeContent: expect.any(Function) }),
                mockRunConfig.contextDirectories
            );
            expect(mockPromptInstance.addInstruction).toHaveBeenCalled();

            // Verify content was added
            expect(mockPromptInstance.addContent).toHaveBeenCalled();

            expect(prompt).toBe(mockPromptInstance);
        });
    });

    describe('format', () => {
        it('should format a prompt into a chat request', () => {
            const request = factory.format(mockPromptInstance);

            expect(Formatter.create).toHaveBeenCalledWith(mockModel);
            expect(request).toHaveProperty('model', mockModel.name);
            expect(request).toHaveProperty('messages');
        });
    });

    describe('generateOverrideContent', () => {
        it('should generate override content when files exist', async () => {
            // Setup storage mock for existing files
            mockStorage.exists.mockImplementation(async (path: string) => {
                if (path.endsWith('-pre.md') || path.endsWith('-post.md') || path.endsWith('.md')) {
                    return true;
                }
                return false;
            });
            mockStorage.readFile.mockImplementation(async (path: string) => {
                if (path.endsWith('-pre.md')) {
                    return 'prepend content';
                } else if (path.endsWith('-post.md')) {
                    return 'append content';
                } else if (path.endsWith('.md')) {
                    return 'override content';
                }
                return '';
            });

            const configDir = '/test/config';
            const overrideFile = 'test.md';

            const result = await factory.generateOverrideContent(configDir, overrideFile);

            expect(mockStorage.exists).toHaveBeenCalledTimes(3);
            expect(mockStorage.readFile).toHaveBeenCalledTimes(3);
            expect(result).toEqual({
                override: 'override content',
                prepend: 'prepend content',
                append: 'append content'
            });
        });

        it('should handle missing files gracefully', async () => {
            // Setup storage mock for non-existing files
            mockStorage.exists.mockResolvedValue(false);

            const configDir = '/test/config';
            const overrideFile = 'nonexistent.md';

            const result = await factory.generateOverrideContent(configDir, overrideFile);

            expect(result).toEqual({});
        });
    });

});
