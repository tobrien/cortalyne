import { jest } from '@jest/globals';
import * as MinorPromptTypes from '@tobrien/minorprompt';
import * as ChatTypes from '@tobrien/minorprompt/chat';

// Define mock interfaces
interface MockPrompt {
    addPersona: jest.Mock;
    addInstruction: jest.Mock;
    addContent: jest.Mock;
    addContext: jest.Mock;
}

interface ClassifiedTranscription {
    text: string;
    type: string;
    subject: string;
}

// Mock the modules before importing
const mockLogger = {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

jest.unstable_mockModule('../../src/logging', () => ({
    getLogger: jest.fn(() => mockLogger)
}));

const mockStorage = {
    exists: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn()
};

jest.unstable_mockModule('../../src/util/storage', () => ({
    create: jest.fn(() => mockStorage)
}));

// Mock the override module
const mockFormat = jest.fn<(prompt: any, model: any) => any>()
    .mockImplementation((prompt, model) => ({ messages: ['formatted prompt'] }));

const mockOverrideContent = jest.fn<(configDir: string, overrideFile: string, overrides: boolean) => Promise<any>>()
    .mockResolvedValue({});

const mockCustomize = jest.fn<(configDir: string, overrideFile: string, content: string, overrides: boolean) => Promise<string>>()
    .mockResolvedValue("");

jest.unstable_mockModule('../../src/prompt/override', () => ({
    format: mockFormat,
    overrideContent: mockOverrideContent,
    customize: mockCustomize
}));

// Mock MinorPrompt
const mockPrompt: MockPrompt = {
    addPersona: jest.fn(),
    addInstruction: jest.fn(),
    addContent: jest.fn(),
    addContext: jest.fn()
};

jest.unstable_mockModule('@tobrien/minorprompt', () => ({
    create: jest.fn(() => mockPrompt)
}));

jest.unstable_mockModule('@tobrien/minorprompt/formatter', () => ({
    create: jest.fn(() => ({
        format: jest.fn(prompt => ({ messages: ['formatted prompt'] }))
    }))
}));

jest.unstable_mockModule('@tobrien/minorprompt/chat', () => ({
    Model: {
        GPT3_5: 'gpt-3.5-turbo',
        GPT4: 'gpt-4'
    }
}));

// Mock the instruction modules
const mockInstruction = { type: 'instruction', content: 'test instruction' };

jest.unstable_mockModule('../../src/prompt/instructions/classify', () => ({
    // @ts-ignore
    create: jest.fn().mockResolvedValue([mockInstruction])
}));

jest.unstable_mockModule('../../src/prompt/instructions/compose', () => ({
    // @ts-ignore
    create: jest.fn().mockResolvedValue([mockInstruction])
}));

// Mock the persona modules
const mockPersona = { type: 'persona', content: 'test persona' };

jest.unstable_mockModule('../../src/prompt/persona/classifier', () => ({
    // @ts-ignore
    create: jest.fn().mockResolvedValue(mockPersona)
}));

jest.unstable_mockModule('../../src/prompt/persona/you', () => ({
    // @ts-ignore
    create: jest.fn().mockResolvedValue(mockPersona)
}));

// Mock context module
const mockSection = {
    add: jest.fn(),
    title: 'Test Section'
};

jest.unstable_mockModule('../../src/prompt/context', () => ({
    // @ts-ignore
    loadContextFromDirectories: jest.fn().mockResolvedValue([mockSection])
}));

// Use our utility functions
jest.unstable_mockModule('../../src/util/general', () => ({
    stringifyJSON: jest.fn(obj => JSON.stringify(obj))
}));

// Import variables
let Prompts: any;
let MinorPrompt: any;
let ClassifyInstructions: any;
let ComposeInstructions: any;
let ClassifyPersona: any;
let YouPersona: any;
let Context: any;
let Chat: any;
let Formatter: any;
let General: any;
let Override: any;

describe('prompts', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        // Reset mock implementations
        mockFormat.mockImplementation((prompt, model) => ({ messages: ['formatted prompt'] }));
        mockOverrideContent.mockResolvedValue({});
        mockCustomize.mockResolvedValue("");

        // Import modules
        Prompts = await import('../../src/prompt/prompts');
        MinorPrompt = await import('@tobrien/minorprompt');
        ClassifyInstructions = await import('../../src/prompt/instructions/classify');
        ComposeInstructions = await import('../../src/prompt/instructions/compose');
        ClassifyPersona = await import('../../src/prompt/persona/classifier');
        YouPersona = await import('../../src/prompt/persona/you');
        Context = await import('../../src/prompt/context');
        Chat = await import('@tobrien/minorprompt/chat');
        Formatter = await import('@tobrien/minorprompt/formatter');
        General = await import('../../src/util/general');
        Override = await import('../../src/prompt/override');
    });

    describe('create', () => {
        it('should create a factory with classification and compose methods', () => {
            // @ts-ignore - ignoring type errors for simplicity
            const factory = Prompts.create('gpt-4', {
                configDir: '/test/config',
                overrides: false,
                contextDirectories: []
            });

            expect(factory).toHaveProperty('createClassificationPrompt');
            expect(factory).toHaveProperty('createComposePrompt');
        });
    });

    describe('format', () => {
        it('should format a prompt using the provided model', () => {
            // @ts-ignore - ignoring type errors for simplicity
            const result = Override.format(mockPrompt, 'gpt-4');

            expect(mockFormat).toHaveBeenCalledWith(mockPrompt, 'gpt-4');
            expect(result).toEqual({ messages: ['formatted prompt'] });
        });
    });

    describe('overrideContent', () => {
        it('should return empty object when no override files exist', async () => {
            const result = await Override.overrideContent('/test/config', 'test.md', false);

            expect(result).toEqual({});
            expect(mockOverrideContent).toHaveBeenCalledWith('/test/config', 'test.md', false);
        });

        it('should return prepend content when pre file exists', async () => {
            mockOverrideContent.mockResolvedValueOnce({ prepend: 'prepend content' });

            const result = await Override.overrideContent('/test/config', 'test.md', false);

            expect(result).toEqual({ prepend: 'prepend content' });
            expect(mockOverrideContent).toHaveBeenCalledWith('/test/config', 'test.md', false);
        });

        it('should throw error when override file exists but overrides disabled', async () => {
            mockOverrideContent.mockRejectedValueOnce(
                new Error('Core directives are being overwritten')
            );

            await expect(Override.overrideContent('/test/config', 'test.md', false))
                .rejects.toThrow('Core directives are being overwritten');
        });
    });

    describe('customize', () => {
        it('should return original content when no overrides exist', async () => {
            mockCustomize.mockResolvedValueOnce('original content');

            const result = await Override.customize('/test/config', 'test.md', 'original content', false);

            expect(result).toBe('original content');
            expect(mockCustomize).toHaveBeenCalledWith('/test/config', 'test.md', 'original content', false);
        });

        it('should replace content when override exists', async () => {
            mockCustomize.mockResolvedValueOnce('override content');

            const result = await Override.customize('/test/config', 'test.md', 'original content', true);

            expect(result).toBe('override content');
            expect(mockCustomize).toHaveBeenCalledWith('/test/config', 'test.md', 'original content', true);
        });

        it('should prepend and append content when they exist', async () => {
            mockCustomize.mockResolvedValueOnce('prepend content\noriginal content\nappend content');

            const result = await Override.customize('/test/config', 'test.md', 'original content', false);

            expect(result).toBe('prepend content\noriginal content\nappend content');
            expect(mockCustomize).toHaveBeenCalledWith('/test/config', 'test.md', 'original content', false);
        });
    });

    describe('createClassificationPrompt', () => {
        it('should create a classification prompt with proper components', async () => {
            // @ts-ignore - ignoring type errors for simplicity
            const factory = Prompts.create('gpt-4', {
                configDir: '/test/config',
                overrides: false,
                contextDirectories: ['/test/context']
            });

            const prompt = await factory.createClassificationPrompt('test transcription');

            expect(MinorPrompt.create).toHaveBeenCalled();
            expect(ClassifyPersona.create).toHaveBeenCalledWith('/test/config', false, { customize: expect.any(Function) });
            expect(ClassifyInstructions.create).toHaveBeenCalledWith('/test/config', false, { overrideContent: expect.any(Function) });
            expect(Context.loadContextFromDirectories).toHaveBeenCalledWith(['/test/context']);

            expect(mockPrompt.addPersona).toHaveBeenCalledWith(mockPersona);
            expect(mockPrompt.addInstruction).toHaveBeenCalledWith(mockInstruction);
            expect(mockPrompt.addContent).toHaveBeenCalledWith('test transcription');
            expect(mockPrompt.addContext).toHaveBeenCalledWith(mockSection);
        });
    });

    describe('createComposePrompt', () => {
        it('should create a compose prompt with proper components', async () => {
            // @ts-ignore - ignoring type errors for simplicity
            const factory = Prompts.create('gpt-4', {
                configDir: '/test/config',
                overrides: false,
                contextDirectories: ['/test/context']
            });

            const transcription: ClassifiedTranscription = {
                text: 'test transcription',
                type: 'note',
                subject: 'test subject'
            };

            const prompt = await factory.createComposePrompt(transcription, 'note');

            expect(MinorPrompt.create).toHaveBeenCalled();
            expect(YouPersona.create).toHaveBeenCalledWith('/test/config', false, { customize: expect.any(Function) });
            expect(ComposeInstructions.create).toHaveBeenCalledWith('note', '/test/config', false, { customize: expect.any(Function) }, ['/test/context']);
            expect(Context.loadContextFromDirectories).toHaveBeenCalledWith(['/test/context']);
            expect(General.stringifyJSON).toHaveBeenCalledWith(transcription);

            expect(mockPrompt.addPersona).toHaveBeenCalledWith(mockPersona);
            expect(mockPrompt.addInstruction).toHaveBeenCalledWith(mockInstruction);
            expect(mockPrompt.addContent).toHaveBeenCalled();
            expect(mockPrompt.addContext).toHaveBeenCalledWith(mockSection);
        });
    });
});
