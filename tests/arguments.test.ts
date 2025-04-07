import { jest } from '@jest/globals';

// Import modules asynchronously using dynamic imports to support ESM
let mockRun: any;
let configure: any;

// Mock dependencies
jest.mock('../src/run.js', () => ({
    __esModule: true,
    createConfig: jest.fn(() => ({ verbose: false, dryRun: false }))
}));

// Mock the Command class
jest.mock('commander', () => {
    const mockCommand = jest.fn().mockImplementation(() => {
        const cmd = {
            name: jest.fn().mockReturnThis(),
            summary: jest.fn().mockReturnThis(),
            description: jest.fn().mockReturnThis(),
            option: jest.fn().mockReturnThis(),
            version: jest.fn().mockReturnThis(),
            parse: jest.fn(),
            opts: jest.fn().mockReturnValue({
                dryRun: false,
                verbose: false,
                debug: false,
                openaiApiKey: 'test-api-key',
                timezone: 'America/New_York',
                transcriptionModel: 'test-transcription-model',
                model: 'gpt-4o',
                contentTypes: ['diff', 'log'],
                recursive: false,
                inputDirectory: 'test-input-directory',
                outputDirectory: 'test-output-directory',
                audioExtensions: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'],
                configDir: 'test-config-dir',
                overrides: false,
                classifyModel: 'gpt-4o-mini',
                composeModel: 'o1-mini',
            })
        };
        return cmd;
    });
    return { Command: mockCommand };
});

// Load all dynamic imports before tests
beforeAll(async () => {
    mockRun = await import('../src/run.js');

    const argumentsModule = await import('../src/arguments.js');
    configure = argumentsModule.configure;
});

describe('arguments', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.OPENAI_API_KEY = 'test-api-key';
    });

    afterEach(() => {
        delete process.env.OPENAI_API_KEY;
    });


    describe('configure', () => {
        it('should configure program with all options', async () => {
            const [config] = await configure();
            expect(config).toBeDefined();
            expect(config.dryRun).toBe(false);
            expect(config.verbose).toBe(false);
            expect(config.debug).toBe(false);
            expect(config.diff).toBe(true);
            expect(config.timezone).toBe('America/New_York');
            expect(config.model).toBe('gpt-4o');
            expect(config.transcriptionModel).toBe('test-transcription-model');
            expect(config.recursive).toBe(false);
            expect(config.inputDirectory).toBe('test-input-directory');
            expect(config.outputDirectory).toBe('test-output-directory');
            expect(config.audioExtensions).toStrictEqual(['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']);
            expect(config.configDir).toBe('test-config-dir');
            expect(config.overrides).toBe(false);
            expect(config.classifyModel).toBe('gpt-4o-mini');
            expect(config.composeModel).toBe('o1-mini');
        });

        it('should configure program with all options', async () => {
            const [config] = await configure();
            expect(config).toBeDefined();
            expect(config.dryRun).toBe(false);
            expect(config.verbose).toBe(false);
            expect(config.debug).toBe(false);
            expect(config.diff).toBe(true);
            expect(config.timezone).toBe('America/New_York');
            expect(config.model).toBe('gpt-4o');
            expect(config.transcriptionModel).toBe('test-transcription-model');
            expect(config.recursive).toBe(false);
            expect(config.inputDirectory).toBe('test-input-directory');
            expect(config.outputDirectory).toBe('test-output-directory');
            expect(config.audioExtensions).toStrictEqual(['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']);
            expect(config.configDir).toBe('test-config-dir');
            expect(config.overrides).toBe(false);
            expect(config.classifyModel).toBe('gpt-4o-mini');
            expect(config.composeModel).toBe('o1-mini');
        });
    });
});  
