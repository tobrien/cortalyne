import { jest } from '@jest/globals';

// Variables to hold dynamically imported modules
let cortalyne: { main: () => Promise<void> };

// Define a simplified mock config 
const mockConfig = {
    dryRun: false,
    verbose: false,
    debug: false,
    diff: false,
    log: false,
    model: 'gpt-4o',
    transcriptionModel: 'whisper-1',
    contentTypes: ['diff', 'log'],
    configDir: 'test-config-dir',
    overrides: false,
    classifyModel: 'gpt-4o-mini',
    composeModel: 'o1-mini',
    timezone: 'America/New_York',
    outputStructure: 'month',
    filenameOptions: { date: true, time: true },
    inputDirectory: 'test-input-directory',
    outputDirectory: 'test-output-directory',
    recursive: false,
    audioExtensions: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
};

// Mock dependencies to prevent the test from running actual operations
jest.unstable_mockModule('../src/arguments', () => ({
    // @ts-ignore - ignore TypeScript errors for jest mocks
    configure: jest.fn().mockResolvedValue([mockConfig])
}));

// Mock logging to avoid actual console output during tests
const mockLogger = {
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

jest.unstable_mockModule('../src/logging', () => ({
    getLogger: jest.fn().mockReturnValue(mockLogger),
    setLogLevel: jest.fn()
}));

// Mock Processor to prevent actual processing
const mockProcessorProcess = jest.fn();
mockProcessorProcess.mockImplementation(() => Promise.resolve());

jest.unstable_mockModule('../src/processor', () => ({
    // @ts-ignore - ignore TypeScript errors for jest mocks
    create: jest.fn().mockReturnValue({
        process: mockProcessorProcess
    })
}));

// Mock Cabazooka to avoid actual operations
const mockProcessFn = jest.fn().mockImplementation(async (callback: any) => {
    // Simulate processing a single file to test the callback
    await callback('test-file.mp3');
    return Promise.resolve();
});

const mockOperator = {
    process: mockProcessFn,
    // @ts-ignore - ignore TypeScript errors for jest mocks
    constructFilename: jest.fn().mockResolvedValue('test-filename'),
    // @ts-ignore - ignore TypeScript errors for jest mocks
    constructOutputDirectory: jest.fn().mockResolvedValue('test-output-dir')
};

const mockCabazookaInstance = {
    configure: jest.fn(),
    setLogger: jest.fn(),
    // @ts-ignore - ignore TypeScript errors for jest mocks
    operate: jest.fn().mockResolvedValue(mockOperator)
};

const mockCabazookaOptions = {
    defaults: {
        timezone: 'America/New_York',
        outputStructure: 'month',
        filenameOptions: { date: true, time: true },
        inputDirectory: 'test-input-directory',
        outputDirectory: 'test-output-directory',
    },
    allowed: {
        outputStructures: ['month'],
        filenameOptions: ['date', 'time'],
        extensions: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
    },
    features: ['input', 'output', 'structured-output', 'extensions'],
};

jest.unstable_mockModule('@tobrien/cabazooka', () => ({
    createOptions: jest.fn().mockReturnValue(mockCabazookaOptions),
    create: jest.fn().mockReturnValue(mockCabazookaInstance)
}));

// Mock process.exit to prevent tests from actually exiting
const originalExit = process.exit;
beforeAll(() => {
    process.exit = jest.fn() as any;
});

afterAll(() => {
    process.exit = originalExit;
});

// Load all dynamic imports before tests
beforeAll(async () => {
    // Import the module under test after all mocks are set up
    cortalyne = await import('../src/cortalyne.js');
});

describe('main', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should run the main process successfully', async () => {
        await cortalyne.main();

        // Verify that the logger was configured
        expect(mockLogger.debug).toHaveBeenCalledWith('Debug logging enabled');

        // Check that the debug was called with an object containing the run config
        expect(mockLogger.debug).toHaveBeenNthCalledWith(2, 'Run config: %j', expect.any(Object));

        // Verify that the operator.process was called
        expect(mockProcessFn).toHaveBeenCalled();

        // Verify that the processor.process was called with the test file
        expect(mockProcessorProcess).toHaveBeenCalledWith('test-file.mp3');
    });

    it('should handle errors gracefully', async () => {
        // Set up the operator to throw an error
        // @ts-ignore - ignore TypeScript errors for jest mocks
        mockProcessFn.mockRejectedValueOnce(new Error('Test error'));

        await cortalyne.main();

        // Verify error was logged
        expect(mockLogger.error).toHaveBeenCalledWith(
            'Exiting due to Error: %s, %s',
            'Test error',
            expect.any(String)
        );

        // Verify process.exit was called with code 1
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should set verbose log level when verbose is true', async () => {
        // Create a config with verbose set to true
        const verboseConfig = {
            ...mockConfig,
            verbose: true
        };

        // Mock Arguments.configure to return config with verbose set to true
        const argumentsModule = await import('../src/arguments.js');
        // @ts-ignore - ignore TypeScript errors for jest mocks
        (argumentsModule.configure as jest.Mock).mockResolvedValueOnce([verboseConfig]);

        const loggingModule = await import('../src/logging.js');

        await cortalyne.main();

        // Verify setLogLevel was called with 'verbose'
        expect(loggingModule.setLogLevel).toHaveBeenCalledWith('verbose');
    });

    it('should set debug log level when debug is true', async () => {
        // Create a config with debug set to true
        const debugConfig = {
            ...mockConfig,
            debug: true
        };

        // Mock Arguments.configure to return config with debug set to true
        const argumentsModule = await import('../src/arguments.js');
        // @ts-ignore - ignore TypeScript errors for jest mocks
        (argumentsModule.configure as jest.Mock).mockResolvedValueOnce([debugConfig]);

        const loggingModule = await import('../src/logging.js');

        await cortalyne.main();

        // Verify setLogLevel was called with 'debug'
        expect(loggingModule.setLogLevel).toHaveBeenCalledWith('debug');
    });
});
