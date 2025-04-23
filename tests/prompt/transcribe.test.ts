import { jest } from '@jest/globals';

// Mock the logging module
jest.unstable_mockModule('../../src/logging', () => ({
    getLogger: jest.fn()
}));

// Mock the constants module
jest.unstable_mockModule('../../src/constants', () => ({
    DEFAULT_PERSONA_TRANSCRIBE_TRAITS_FILE: '/test/personas/transcribe/traits.md',
    DEFAULT_PERSONA_TRANSCRIBE_INSTRUCTIONS_FILE: '/test/personas/transcribe/instructions.md',
    DEFAULT_INSTRUCTIONS_TRANSCRIBE_FILE: '/test/instructions/transcribe.md'
}));

// Mock the context module
jest.unstable_mockModule('../../src/prompt/context', () => ({
    // @ts-ignore
    loadContextFromDirectories: jest.fn().mockResolvedValue([])
}));

// Mock the override module
const mockCustomize = jest.fn();
const mockOverrideContent = jest.fn();
jest.unstable_mockModule('../../src/prompt/override', () => ({
    customize: mockCustomize,
    overrideContent: mockOverrideContent
}));

// Mock MinorPrompt
const mockInstruction = { text: 'transcribe instruction' };
const mockSection = { title: 'Test Section', content: 'test section content' };
const mockPrompt = {
    addPersona: jest.fn(),
    addInstruction: jest.fn(),
    addContent: jest.fn(),
    addContext: jest.fn(),
};

jest.unstable_mockModule('@tobrien/minorprompt', () => ({
    create: jest.fn(() => mockPrompt),
    createPersona: jest.fn(() => ({
        addTrait: jest.fn(),
        addInstruction: jest.fn(),
    })),
    createInstruction: jest.fn(() => mockInstruction),
    createSection: jest.fn(() => mockSection),
}));

jest.unstable_mockModule('@tobrien/minorprompt/chat', () => ({
    Model: {
        GPT4: 'gpt-4',
        GPT35Turbo: 'gpt-3.5-turbo'
    }
}));

// Import variables
let Transcribe: any;
let MinorPrompt: any;
let Logging: any;
let Context: any;
let Override: any;
let Constants: any;

describe('transcribe', () => {
    let mockLogger: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Setup logger mock
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Reset mock implementations
        // @ts-ignore
        mockCustomize.mockImplementation((configDir: any, file: any, content: any) => Promise.resolve(content));

        // Import modules
        Constants = await import('../../src/constants');
        Logging = await import('../../src/logging');
        (Logging.getLogger as jest.Mock).mockReturnValue(mockLogger);

        MinorPrompt = await import('@tobrien/minorprompt');
        Context = await import('../../src/prompt/context');
        Override = await import('../../src/prompt/override');
        Transcribe = await import('../../src/prompt/transcribe');
    });

    describe('createTranscribePersona', () => {
        it('should create a transcribe persona with customized traits and instructions', async () => {
            const configDir = '/test/config';
            const overrides = true;

            // Setup customize mock for this test
            // @ts-ignore
            mockCustomize.mockImplementation((configDir: any, file: any, content: any) => {
                if (file.includes('traits')) return 'customized traits';
                if (file.includes('instructions')) return 'customized instructions';
                return content;
            });

            const persona = await Transcribe.createTranscribePersona(configDir, overrides, { customize: mockCustomize });

            expect(persona).toBeDefined();
            expect(mockCustomize).toHaveBeenCalledTimes(2);
            expect(mockCustomize).toHaveBeenCalledWith(
                configDir,
                Constants.DEFAULT_PERSONA_TRANSCRIBE_TRAITS_FILE,
                expect.any(String),
                overrides
            );
            expect(mockCustomize).toHaveBeenCalledWith(
                configDir,
                Constants.DEFAULT_PERSONA_TRANSCRIBE_INSTRUCTIONS_FILE,
                expect.any(String),
                overrides
            );

            expect(mockLogger.debug).toHaveBeenCalledWith('Final Transcribe traits: %s', 'customized traits');
            expect(mockLogger.debug).toHaveBeenCalledWith('Final Transcribe instructions: %s', 'customized instructions');

            expect(MinorPrompt.createPersona).toHaveBeenCalledWith('transcriber');
            expect(persona.addTrait).toHaveBeenCalledWith('customized traits');
            expect(persona.addInstruction).toHaveBeenCalledWith('customized instructions');
        });
    });

    describe('createTranscribeInstructions', () => {
        it('should create transcribe instructions with customized content', async () => {
            const configDir = '/test/config';
            const overrides = true;

            // Setup customize mock
            mockCustomize.mockImplementation(() => Promise.resolve('customized instructions'));

            const instructions = await Transcribe.createTranscribeInstructions(configDir, overrides, { customize: mockCustomize });

            expect(instructions).toHaveLength(1);
            expect(mockCustomize).toHaveBeenCalledWith(
                configDir,
                Constants.DEFAULT_INSTRUCTIONS_TRANSCRIBE_FILE,
                expect.any(String),
                overrides
            );
            expect(MinorPrompt.createInstruction).toHaveBeenCalledWith('customized instructions');
            expect(instructions[0]).toEqual(mockInstruction);
        });

        it('should include context sections when contextDirectories are provided', async () => {
            const configDir = '/test/config';
            const overrides = true;

            const instructions = await Transcribe.createTranscribeInstructions(
                configDir,
                overrides,
                { customize: mockCustomize },
            );

            expect(instructions).toHaveLength(1); // 1 instruction + 2 context sections
            expect(instructions[0]).toEqual(mockInstruction);
        });
    });

    describe('createTranscribePrompt', () => {
        it('should create a complete transcribe prompt', async () => {
            const transcriptionText = 'This is a test transcription';
            const config = {
                configDir: '/test/config',
                overrides: true,
            };

            // Mock persona and instructions
            const mockContextSections = [{ type: 'context' }];

            // @ts-ignore
            (Context.loadContextFromDirectories as jest.Mock).mockResolvedValueOnce(mockContextSections);

            const prompt = await Transcribe.createTranscribePrompt(transcriptionText, config as any);

            expect(prompt).toBe(mockPrompt);

            expect(prompt.addContent).toHaveBeenCalledWith(transcriptionText);
        });
    });

    describe('create', () => {
        it('should create a factory with createTranscribePrompt method', () => {
            const model = 'gpt-4';
            const config = {
                configDir: '/test/config',
                overrides: true
            };

            const factory = Transcribe.create(model, config as any);

            expect(factory).toHaveProperty('createTranscribePrompt');
            expect(typeof factory.createTranscribePrompt).toBe('function');
        });

        it('should call createTranscribePrompt when using the factory', async () => {
            const model = 'gpt-4';
            const config = {
                configDir: '/test/config',
                overrides: true
            };
            const transcriptionText = 'Test transcription';

            const factory = Transcribe.create(model, config as any);
            const result = await factory.createTranscribePrompt(transcriptionText);

            expect(result).toBe(mockPrompt);
        });
    });
}); 