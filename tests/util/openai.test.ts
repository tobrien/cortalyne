import { jest } from '@jest/globals';
import { createMocks } from '../../jest-mocks/setup';

// Get our mock objects
const mocks = createMocks();

// Setup module mocks
jest.unstable_mockModule('openai', () => ({
    OpenAI: mocks.openAIConstructor
}));

jest.unstable_mockModule('../../src/util/storage.js', () => ({
    create: mocks.storageCreateMock
}));

jest.unstable_mockModule('../../src/logging.js', () => ({
    getLogger: mocks.getLoggerMock
}));

// Import the module under test
let openAiUtils: any;

describe('OpenAI utilities', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        jest.resetModules();

        // Reset mocks
        mocks.getLoggerMock.mockReturnValue(mocks.loggerMock);

        // Import the module under test
        openAiUtils = await import('../../src/util/openai.js');
    });

    describe('createCompletion', () => {
        it('should successfully create a completion', async () => {
            const mockMessages = [{ role: 'user', content: 'test' }];
            const mockResponse = { choices: [{ message: { content: 'test response' } }] };

            // @ts-ignore
            mocks.openAICreateMock.mockResolvedValue(mockResponse);
            process.env.OPENAI_API_KEY = 'test-key';

            const result = await openAiUtils.createCompletion(mockMessages);

            expect(result).toBe('test response');
            expect(mocks.loggerMock.debug).toHaveBeenCalledWith('Sending prompt to OpenAI: %j', mockMessages);
            expect(mocks.loggerMock.debug).toHaveBeenCalledWith('Received response from OpenAI: %s', 'test response');
        });

        it('should handle JSON response format', async () => {
            const mockMessages = [{ role: 'user', content: 'test' }];
            const mockResponse = { choices: [{ message: { content: '{"key": "value"}' } }] };

            // @ts-ignore
            mocks.openAICreateMock.mockResolvedValue(mockResponse);
            process.env.OPENAI_API_KEY = 'test-key';

            const result = await openAiUtils.createCompletion(mockMessages, { responseFormat: { type: 'json' } });

            expect(result).toEqual({ key: "value" });
        });

        it('should write debug file when debug options are provided', async () => {
            const mockMessages = [{ role: 'user', content: 'test' }];
            const mockResponse = { choices: [{ message: { content: 'test response' } }] };

            // @ts-ignore
            mocks.openAICreateMock.mockResolvedValue(mockResponse);
            process.env.OPENAI_API_KEY = 'test-key';

            await openAiUtils.createCompletion(mockMessages, { debug: true, debugFile: 'debug.json' });

            expect(mocks.storageMock.writeFile).toHaveBeenCalledWith(
                'debug.json',
                JSON.stringify(mockResponse, null, 2),
                'utf8'
            );
            expect(mocks.loggerMock.debug).toHaveBeenCalledWith('Wrote debug file to %s', 'debug.json');
        });

        it('should throw error when API key is missing', async () => {
            delete process.env.OPENAI_API_KEY;

            await expect(openAiUtils.createCompletion([]))
                .rejects
                .toThrow('OPENAI_API_KEY environment variable is not set');
        });

        it('should throw error when no response is received', async () => {
            const mockResponse = { choices: [{ message: { content: '' } }] };

            // @ts-ignore
            mocks.openAICreateMock.mockResolvedValue(mockResponse);
            process.env.OPENAI_API_KEY = 'test-key';

            await expect(openAiUtils.createCompletion([]))
                .rejects
                .toThrow('No response received from OpenAI');
        });
    });

    describe('transcribeAudio', () => {
        it('should successfully transcribe audio', async () => {
            const mockFilePath = '/test/audio.mp3';
            const mockTranscription = { text: 'test transcription' };
            const mockStream = {};

            // @ts-ignore
            mocks.storageMock.readStream.mockResolvedValue(mockStream);
            // @ts-ignore
            mocks.openAITranscribeMock.mockResolvedValue(mockTranscription);
            process.env.OPENAI_API_KEY = 'test-key';

            const result = await openAiUtils.transcribeAudio(mockFilePath);

            expect(result).toEqual(mockTranscription);
            expect(mocks.loggerMock.debug).toHaveBeenCalledWith('Transcribing audio file: %s', mockFilePath);
            expect(mocks.loggerMock.debug).toHaveBeenCalledWith('Received transcription from OpenAI: %s', mockTranscription);
        });

        it('should write debug file when debug options are provided', async () => {
            const mockFilePath = '/test/audio.mp3';
            const mockTranscription = { text: 'test transcription' };
            const mockStream = {};

            // @ts-ignore
            mocks.storageMock.readStream.mockResolvedValue(mockStream);
            // @ts-ignore
            mocks.openAITranscribeMock.mockResolvedValue(mockTranscription);
            process.env.OPENAI_API_KEY = 'test-key';

            await openAiUtils.transcribeAudio(mockFilePath, { debug: true, debugFile: 'transcription-debug.json' });

            expect(mocks.storageMock.writeFile).toHaveBeenCalledWith(
                'transcription-debug.json',
                JSON.stringify(mockTranscription, null, 2),
                'utf8'
            );
            expect(mocks.loggerMock.debug).toHaveBeenCalledWith('Wrote debug file to %s', 'transcription-debug.json');
        });

        it('should throw error when API key is missing', async () => {
            delete process.env.OPENAI_API_KEY;

            await expect(openAiUtils.transcribeAudio('/test/audio.mp3'))
                .rejects
                .toThrow('OPENAI_API_KEY environment variable is not set');
        });

        it('should throw error when no transcription is received', async () => {
            const mockStream = {};

            // @ts-ignore
            mocks.storageMock.readStream.mockResolvedValue(mockStream);
            // @ts-ignore
            mocks.openAITranscribeMock.mockResolvedValue(null);
            process.env.OPENAI_API_KEY = 'test-key';

            await expect(openAiUtils.transcribeAudio('/test/audio.mp3'))
                .rejects
                .toThrow('No transcription received from OpenAI');
        });
    });
});
