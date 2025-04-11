import { jest } from '@jest/globals';
import { ArgumentError } from '../src/error/ArgumentError';

// Import modules asynchronously using dynamic imports to support ESM
let mockRun: any;
let configure: any;
let validateTimezone: any;
let validateOutputStructure: any;
let validateFilenameOptions: any;

// Mock dependencies
jest.mock('../src/run.js', () => ({
    __esModule: true,
    createConfig: jest.fn(() => ({ verbose: false, dryRun: false, diff: true }))
}));

// Mock Storage utility
jest.mock('../src/util/storage.js', () => ({
    __esModule: true,
    create: jest.fn(() => ({
        isDirectoryReadable: jest.fn(() => true),
        isDirectoryWritable: jest.fn(() => true)
    }))
}));

// Mock the Dates utility
jest.mock('../src/util/dates.js', () => ({
    __esModule: true,
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

// Load all dynamic imports before tests
beforeAll(async () => {
    mockRun = await import('../src/run.js');

    const argumentsModule = await import('../src/arguments.js');
    configure = argumentsModule.configure;
    validateTimezone = argumentsModule.validateTimezone;
    validateOutputStructure = argumentsModule.validateOutputStructure;
    validateFilenameOptions = argumentsModule.validateFilenameOptions;
});

describe('arguments', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.OPENAI_API_KEY = 'test-api-key';

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

            await expect(configure()).rejects.toThrow('OpenAI API key is required');
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

            await expect(configure()).rejects.toThrow(/Invalid model/);
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

            await expect(configure()).rejects.toThrow(/Invalid model/);
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

            await expect(configure()).rejects.toThrow(/Invalid model/);
        });

        it('should throw error for invalid audio extensions', async () => {
            // Now that the bug in validateOptions has been fixed,
            // we can properly test invalid audio extensions

            // Mock the invalid audio extensions value
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
                audioExtensions: ['mp3', 'invalid-ext'], // Invalid audio extension
                configDir: 'test-config-dir',
                overrides: false,
                classifyModel: 'gpt-4o-mini',
                composeModel: 'o1-mini',
            });

            await expect(configure()).rejects.toThrow(/Invalid audio extension/);
        });
    });

    describe('validateTimezone', () => {
        it('should return the timezone if valid', () => {
            const result = validateTimezone('America/New_York');
            expect(result).toBe('America/New_York');
        });

        it('should throw an ArgumentError if timezone is invalid', () => {
            expect(() => validateTimezone('Invalid/Timezone')).toThrow(ArgumentError);
            expect(() => validateTimezone('Invalid/Timezone')).toThrow(/Invalid timezone/);
        });
    });

    describe('validateOutputStructure', () => {
        it('should not throw error for valid output structure', () => {
            expect(() => validateOutputStructure('year')).not.toThrow();
            expect(() => validateOutputStructure('month')).not.toThrow();
            expect(() => validateOutputStructure('day')).not.toThrow();
            expect(() => validateOutputStructure('none')).not.toThrow();
            expect(() => validateOutputStructure(undefined)).not.toThrow();
        });

        it('should throw ArgumentError for invalid output structure', () => {
            expect(() => validateOutputStructure('invalid')).toThrow(ArgumentError);
            expect(() => validateOutputStructure('invalid')).toThrow(/Invalid output structure/);
        });
    });

    describe('validateFilenameOptions', () => {
        it('should not throw error for valid filename options', () => {
            expect(() => validateFilenameOptions(['date', 'time'], 'month')).not.toThrow();
            expect(() => validateFilenameOptions(['subject'], 'none')).not.toThrow();
            expect(() => validateFilenameOptions(['date', 'subject'], 'year')).not.toThrow();
            expect(() => validateFilenameOptions(undefined, undefined)).not.toThrow();
        });

        it('should throw ArgumentError for invalid filename options', () => {
            expect(() => validateFilenameOptions(['invalid'], 'month')).toThrow(ArgumentError);
            expect(() => validateFilenameOptions(['invalid'], 'month')).toThrow(/Invalid filename options/);
        });

        it('should throw ArgumentError for comma-separated list', () => {
            expect(() => validateFilenameOptions(['date,time'], 'month')).toThrow(ArgumentError);
            expect(() => validateFilenameOptions(['date,time'], 'month')).toThrow(/Filename options should be space-separated/);
        });

        it('should throw ArgumentError for using date with day output structure', () => {
            expect(() => validateFilenameOptions(['date'], 'day')).toThrow(ArgumentError);
            expect(() => validateFilenameOptions(['date'], 'day')).toThrow(/Cannot use date in filename when output structure is "day"/);
        });

        it('should throw ArgumentError for quoted string containing multiple options', () => {
            expect(() => validateFilenameOptions(['date time'], 'month')).toThrow(ArgumentError);
            expect(() => validateFilenameOptions(['date time'], 'month')).toThrow(/Filename options should not be quoted/);
        });
    });
});  
