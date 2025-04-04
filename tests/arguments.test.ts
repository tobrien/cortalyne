import { jest } from '@jest/globals';
import { DEFAULT_INSTRUCTIONS, DEFAULT_MODEL } from '../src/constants.js';

// Import modules asynchronously using dynamic imports to support ESM
let mockRun: any;
let mockExport: any;
let ArgumentError: any;
let configure: any;
let generateConfig: any;
let Storage: any;

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
                openaiApiKey: 'test-api-key'
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
            expect(config.log).toBe(false);
            expect(config.instructions).toBe(DEFAULT_INSTRUCTIONS);
            expect(config.model).toBe(DEFAULT_MODEL);
        });

        it('should configure program with all options', async () => {
            const [config] = await configure();
            expect(config).toBeDefined();
            expect(config.dryRun).toBe(false);
            expect(config.verbose).toBe(false);
            expect(config.debug).toBe(false);
            expect(config.diff).toBe(true);
            expect(config.log).toBe(false);
            expect(config.instructions).toBe(DEFAULT_INSTRUCTIONS);
            expect(config.model).toBe(DEFAULT_MODEL);
        });
    });
});  
