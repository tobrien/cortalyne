import { jest } from '@jest/globals';
import { ArgumentError } from '../src/error/ArgumentError';

// Import modules asynchronously using dynamic imports to support ESM
let mockCabazooka: any;
let configure: any;

// Mock dependencies
jest.unstable_mockModule('../src/main', () => ({
    createConfig: jest.fn(() => ({ verbose: false, dryRun: false, diff: true }))
}));

// Mock Storage utility
const mockIsDirectoryReadable = jest.fn(() => true);
const mockIsDirectoryWritable = jest.fn(() => true);

jest.unstable_mockModule('../src/util/storage', () => ({
    create: jest.fn(() => ({
        isDirectoryReadable: mockIsDirectoryReadable,
        isDirectoryWritable: mockIsDirectoryWritable
    }))
}));

// Mock the Dates utility
jest.unstable_mockModule('../src/util/dates', () => ({
    validTimezones: jest.fn(() => ['Etc/UTC', 'America/New_York', 'Europe/London'])
}));

// Default commander mock
const defaultCommanderMock = {
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

// Mock the Command class
jest.mock('commander', () => {
    const mockCommand = jest.fn().mockImplementation(() => defaultCommanderMock);
    return { Command: mockCommand };
});

// Mock Cabazooka
const mockCabazookaInstance = {
    configure: jest.fn().mockReturnValue(defaultCommanderMock),
    // @ts-ignore
    validate: jest.fn().mockResolvedValue({
        timezone: 'America/New_York',
        outputStructure: 'month',
        filenameOptions: {
            date: true,
            time: true
        },
        inputDirectory: 'test-input-directory',
        outputDirectory: 'test-output-directory',
        recursive: false,
        audioExtensions: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
    } as any)
};

// Load all dynamic imports before tests
beforeAll(async () => {
    const argumentsModule = await import('../src/arguments.js');
    configure = argumentsModule.configure;
});

describe('arguments', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.OPENAI_API_KEY = 'test-api-key';
        mockIsDirectoryReadable.mockReturnValue(true);

        // Reset the mock commander opts value
        defaultCommanderMock.opts.mockReturnValue({
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
        });
    });

    afterEach(() => {
        delete process.env.OPENAI_API_KEY;
    });

    describe('configure', () => {
        it('should configure program with all options', async () => {
            const [config] = await configure(mockCabazookaInstance);
            expect(mockCabazookaInstance.configure).toHaveBeenCalled();
            expect(mockCabazookaInstance.validate).toHaveBeenCalled();
            expect(config).toBeDefined();
        });

        it('should throw error when OpenAI API key is missing', async () => {
            // Delete the API key from env
            delete process.env.OPENAI_API_KEY;

            // Also remove it from the commander opts
            defaultCommanderMock.opts.mockReturnValue({
                dryRun: false,
                verbose: false,
                debug: false,
                // No openaiApiKey
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
            });

            await expect(configure(mockCabazookaInstance)).rejects.toThrow('OpenAI API key is required');
        });

        it('should throw error for invalid config directory', async () => {
            mockIsDirectoryReadable.mockReturnValueOnce(false);

            await expect(configure(mockCabazookaInstance)).rejects.toThrow('Config directory does not exist');
        });

        it('should use default config directory when not provided', async () => {
            // Remove configDir from options
            defaultCommanderMock.opts.mockReturnValue({
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
                overrides: false,
                classifyModel: 'gpt-4o-mini',
                composeModel: 'o1-mini',
                // configDir is missing
            });

            const [config] = await configure(mockCabazookaInstance);
            // Config should contain the default config directory
            expect(config.configDir).toBeDefined();
        });

        it('should use default transcription model when not provided', async () => {
            // Remove transcriptionModel from options
            defaultCommanderMock.opts.mockReturnValue({
                dryRun: false,
                verbose: false,
                debug: false,
                openaiApiKey: 'test-api-key',
                timezone: 'America/New_York',
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
                // transcriptionModel is missing
            });

            const [config] = await configure(mockCabazookaInstance);
            // Config should contain the default transcription model
            expect(config.transcriptionModel).toBeDefined();
        });

        it('should throw error when model is missing', async () => {
            // Remove the main model
            defaultCommanderMock.opts.mockReturnValue({
                dryRun: false,
                verbose: false,
                debug: false,
                openaiApiKey: 'test-api-key',
                timezone: 'America/New_York',
                transcriptionModel: 'test-transcription-model',
                // model is missing
                contentTypes: ['diff', 'log'],
                recursive: false,
                inputDirectory: 'test-input-directory',
                outputDirectory: 'test-output-directory',
                audioExtensions: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'],
                configDir: 'test-config-dir',
                overrides: false,
                classifyModel: 'gpt-4o-mini',
                composeModel: 'o1-mini',
            });

            await expect(configure(mockCabazookaInstance)).rejects.toThrow('Model for --model is required');
        });

        it('should throw error for invalid model', async () => {
            // Mock the invalid model value
            defaultCommanderMock.opts.mockReturnValue({
                dryRun: false,
                verbose: false,
                debug: false,
                openaiApiKey: 'test-api-key',
                timezone: 'America/New_York',
                transcriptionModel: 'test-transcription-model',
                model: 'invalid-model', // Invalid model
                contentTypes: ['diff', 'log'],
                recursive: false,
                inputDirectory: 'test-input-directory',
                outputDirectory: 'test-output-directory',
                audioExtensions: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'],
                configDir: 'test-config-dir',
                overrides: false,
                classifyModel: 'gpt-4o-mini',
                composeModel: 'o1-mini',
            });

            await expect(configure(mockCabazookaInstance)).rejects.toThrow(/Invalid model/);
        });

        it('should throw error for invalid classify model', async () => {
            // Mock the invalid classify model value
            defaultCommanderMock.opts.mockReturnValue({
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
                classifyModel: 'invalid-model', // Invalid classify model
                composeModel: 'o1-mini',
            });

            await expect(configure(mockCabazookaInstance)).rejects.toThrow(/Invalid model/);
        });

        it('should throw error for invalid compose model', async () => {
            // Mock the invalid compose model value
            defaultCommanderMock.opts.mockReturnValue({
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
                composeModel: 'invalid-model', // Invalid compose model
            });

            await expect(configure(mockCabazookaInstance)).rejects.toThrow(/Invalid model/);
        });

        it('should throw error for invalid context directories', async () => {
            // Set contextDirectories with an invalid directory
            defaultCommanderMock.opts.mockReturnValue({
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
                contextDirectories: ['invalid-dir']
            });

            // Mock the directory check to return false for the invalid directory
            // @ts-ignore
            mockIsDirectoryReadable.mockImplementation((directory: string) => {
                return directory !== 'invalid-dir';
            });

            await expect(configure(mockCabazookaInstance)).rejects.toThrow('Context directory does not exist or is not readable');
        });

        it('should use default values for optional parameters', async () => {
            // Remove optional parameters
            defaultCommanderMock.opts.mockReturnValue({
                dryRun: false,
                verbose: false,
                debug: false,
                openaiApiKey: 'test-api-key',
                timezone: 'America/New_York',
                model: 'gpt-4o',
                contentTypes: ['diff', 'log'],
                recursive: false,
                inputDirectory: 'test-input-directory',
                outputDirectory: 'test-output-directory',
                audioExtensions: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'],
                // Following optional parameters are missing
                // configDir
                // overrides
                // classifyModel 
                // composeModel
                // transcriptionModel
            });

            const [config] = await configure(mockCabazookaInstance);

            // Config should contain default values for missing parameters
            expect(config.configDir).toBeDefined();
            expect(config.overrides).toBeDefined();
            expect(config.classifyModel).toBeDefined();
            expect(config.composeModel).toBeDefined();
            expect(config.transcriptionModel).toBeDefined();
        });
    });
});  
