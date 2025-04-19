import { jest } from '@jest/globals';

export interface StorageMock {
    writeFile: jest.Mock;
    readStream: jest.Mock;
}

export interface OpenAIMock {
    chat: {
        completions: {
            create: jest.Mock;
        }
    };
    audio: {
        transcriptions: {
            create: jest.Mock;
        }
    };
}

export const createMocks = () => {
    // Mock for OpenAI
    const openAICreateMock = jest.fn();
    const openAITranscribeMock = jest.fn();
    const openAIConstructor = jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: openAICreateMock
            }
        },
        audio: {
            transcriptions: {
                create: openAITranscribeMock
            }
        }
    } as OpenAIMock));

    // Mock for Storage
    const storageMock: StorageMock = {
        writeFile: jest.fn(),
        readStream: jest.fn()
    };
    const storageCreateMock = jest.fn().mockReturnValue(storageMock);

    // Mock for Logger
    const loggerMock = {
        debug: jest.fn(),
        error: jest.fn()
    };
    const getLoggerMock = jest.fn().mockReturnValue(loggerMock);

    return {
        openAICreateMock,
        openAITranscribeMock,
        openAIConstructor,
        storageMock,
        storageCreateMock,
        loggerMock,
        getLoggerMock
    };
}; 