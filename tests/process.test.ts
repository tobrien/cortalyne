import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/logging', () => ({
    getLogger: jest.fn()
}));

jest.unstable_mockModule('../src/output', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../src/phases/classify', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../src/phases/compose', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../src/phases/locate', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../src/prompt/prompts', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../src/prompt/context', () => ({
    loadContextFromDirectories: jest.fn()
}));

let Logging: any;
let Output: any;
let ClassifyPhase: any;
let ComposePhase: any;
let LocatePhase: any;
let Process: any;
let Prompts: any;

describe('process', () => {

    let mockLogger: any;
    let mockOutput: any;
    let mockClassifyPhase: any;
    let mockComposePhase: any;
    let mockLocatePhase: any;
    let mockPrompts: any;
    let processInstance: any;

    const mockRunConfig = {
        timezone: 'America/New_York',
        outputStructure: 'test-structure',
        filenameOptions: {},
        verbose: false,
        debug: false,
        classifyModel: {
            name: 'test-model',
            maxTokens: 1000,
            temperature: 0.7
        },
        composeModel: {
            name: 'test-model',
            maxTokens: 1000,
            temperature: 0.7
        },
        configDir: '/test/config',
        contextDirectories: ['/test/context']
    };

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();

        Logging = await import('../src/logging');
        Output = await import('../src/output');
        ClassifyPhase = await import('../src/phases/classify');
        ComposePhase = await import('../src/phases/compose');
        LocatePhase = await import('../src/phases/locate');
        Process = await import('../src/process');
        Prompts = await import('../src/prompt/prompts');

        // Setup logger mock
        mockLogger = {
            verbose: jest.fn(),
            debug: jest.fn(),
            info: jest.fn()
        };
        (Logging.getLogger as jest.Mock).mockReturnValue(mockLogger);

        // Setup output mock
        mockOutput = {
            constructFilename: jest.fn().mockReturnValue('test-note.md')
        };
        (Output.create as jest.Mock).mockReturnValue(mockOutput);

        // Setup prompts mock
        mockPrompts = {
            createClassificationPrompt: jest.fn().mockImplementation(() => {
                return Promise.resolve({});
            }),
            createComposePrompt: jest.fn().mockImplementation(() => {
                return Promise.resolve({});
            }),
            format: jest.fn().mockReturnValue({
                model: 'test-model',
                messages: []
            })
        };
        (Prompts.create as jest.Mock).mockReturnValue(mockPrompts);

        // Setup phase mocks
        mockClassifyPhase = {
            // @ts-ignore
            classify: jest.fn().mockResolvedValue({
                type: 'note',
                subject: 'Test Subject'
            })
        };
        (ClassifyPhase.create as jest.Mock).mockReturnValue(mockClassifyPhase);

        mockComposePhase = {
            // @ts-ignore
            compose: jest.fn().mockResolvedValue(undefined)
        };
        (ComposePhase.create as jest.Mock).mockReturnValue(mockComposePhase);

        mockLocatePhase = {
            // @ts-ignore
            locate: jest.fn().mockResolvedValue({
                creationTime: new Date(),
                outputPath: '/test/output/path',
                transcriptionFilename: 'test-transcription.txt',
                hash: 'test-hash'
            })
        };
        (LocatePhase.create as jest.Mock).mockReturnValue(mockLocatePhase);

        // Create process instance
        processInstance = Process.create(mockRunConfig as any);
    });

    describe('process', () => {
        it('should process an audio file through all phases', async () => {
            const audioFile = 'test-audio.mp3';

            await processInstance.process(audioFile);

            // Verify locate phase was called
            expect(mockLocatePhase.locate).toHaveBeenCalledWith(audioFile);
            expect(mockLogger.debug).toHaveBeenCalledWith('Locating file %s', audioFile);

            // Verify classify phase was called with correct arguments
            const locateResult = await mockLocatePhase.locate();
            expect(mockClassifyPhase.classify).toHaveBeenCalledWith(
                locateResult.creationTime,
                locateResult.outputPath,
                locateResult.transcriptionFilename,
                locateResult.hash,
                audioFile
            );
            expect(mockLogger.debug).toHaveBeenCalledWith('Classifying file %s', audioFile);

            // Verify compose phase was called with correct arguments
            const classifiedResult = await mockClassifyPhase.classify();
            expect(mockComposePhase.compose).toHaveBeenCalledWith(
                classifiedResult,
                locateResult.outputPath,
                'test-note.md',
                locateResult.hash
            );
            expect(mockLogger.debug).toHaveBeenCalledWith('Composing Note %s in %s', 'test-note.md', locateResult.outputPath);

            // Verify final info log
            expect(mockLogger.info).toHaveBeenCalledWith('Processed file %s', audioFile);
        });

        it('should handle errors during processing', async () => {
            const audioFile = 'test-audio.mp3';
            const error = new Error('Test error');

            // Make locate phase throw an error
            mockLocatePhase.locate.mockRejectedValueOnce(error);

            await expect(processInstance.process(audioFile)).rejects.toThrow(error);

            // Verify no other phases were called
            expect(mockClassifyPhase.classify).not.toHaveBeenCalled();
            expect(mockComposePhase.compose).not.toHaveBeenCalled();
        });

    });
});
