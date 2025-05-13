import { jest } from '@jest/globals';
import path from 'path';

// Mock objects
const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

const mockStorage = {
    exists: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    createDirectory: jest.fn(),
    deleteFile: jest.fn(),
};

const mockMedia = {
    getFileSize: jest.fn(),
    splitAudioFile: jest.fn(),
};

const mockOpenAI = {
    transcribeAudio: jest.fn(),
    createCompletion: jest.fn(),
};

const mockOperator = {
    constructFilename: jest.fn(),
};

const mockPrompts = {
    createTranscribePrompt: jest.fn(),
};

const mockOverride = {
    format: jest.fn(),
};

// Mock the modules before importing
// @ts-ignore
jest.unstable_mockModule('@/logging', () => ({
    getLogger: jest.fn(() => mockLogger),
}));

// @ts-ignore
jest.unstable_mockModule('@/util/storage', () => ({
    create: jest.fn(() => mockStorage),
}));

// @ts-ignore
jest.unstable_mockModule('@/util/media', () => ({
    create: jest.fn(() => mockMedia),
}));

// @ts-ignore
jest.unstable_mockModule('@/util/openai', () => ({
    transcribeAudio: mockOpenAI.transcribeAudio,
    createCompletion: mockOpenAI.createCompletion,
}));

// @ts-ignore
jest.unstable_mockModule('@/util/general', () => ({
    stringifyJSON: jest.fn((obj) => JSON.stringify(obj, null, 2)),
}));

// @ts-ignore
jest.unstable_mockModule('@/prompt/transcribe', () => ({
    create: jest.fn(() => mockPrompts),
}));

// Import the module under test after all mocks are set up
const importTranscribe = async () => {
    // @ts-ignore
    return await import('@/phases/transcribe');
};

describe('Transcribe Phase Tests', () => {
    const config = {
        debug: false,
        transcriptionModel: 'whisper-1',
        composeModel: 'gpt-4',
        maxAudioSize: 1024 * 1024 * 25, // 25MB
        tempDirectory: '/tmp',
    };

    const creation = new Date('2023-01-01T12:00:00Z');
    const outputPath = '/output';
    const contextPath = '/output/context';
    const interimPath = '/output/interim';
    const filename = 'audio.mp3';
    const hash = 'abc123';
    const audioFile = '/path/to/audio.mp3';

    beforeEach(() => {
        jest.clearAllMocks();
        // @ts-ignore
        mockOperator.constructFilename.mockResolvedValue('transcript_abc123.json');
    });

    test('should return existing transcription if file exists', async () => {
        // Setup
        // @ts-ignore
        mockStorage.exists.mockResolvedValue(true);
        // @ts-ignore
        mockStorage.readFile.mockResolvedValue(JSON.stringify({ text: 'existing transcription' }));

        // Execute
        const transcribe = await importTranscribe();
        // @ts-ignore
        const instance = transcribe.create(config, mockOperator);
        const result = await instance.transcribe(creation, outputPath, contextPath, interimPath, filename, hash, audioFile);

        // Verify
        expect(mockStorage.exists).toHaveBeenCalledWith(path.join(interimPath, 'transcript_abc123.json'));
        expect(mockStorage.readFile).toHaveBeenCalled();
        expect(result).toEqual({ text: 'existing transcription' });
        expect(mockOpenAI.transcribeAudio).not.toHaveBeenCalled();
    });

    test('should transcribe audio when file size is within limits', async () => {
        // Setup
        // @ts-ignore
        mockStorage.exists.mockResolvedValue(false);
        // @ts-ignore
        mockMedia.getFileSize.mockResolvedValue(1024 * 1024); // 1MB
        // @ts-ignore
        mockOpenAI.transcribeAudio.mockResolvedValue({ text: 'transcribed text' });
        // @ts-ignore
        mockOperator.constructFilename.mockResolvedValue('transcript_abc123.json');
        // @ts-ignore
        mockPrompts.createTranscribePrompt.mockResolvedValue({
            persona: { items: [{ text: 'Persona' }] },
            instructions: { items: [{ text: 'Instructions' }] },
            contents: { items: [{ text: 'Content' }] },
            contexts: { items: [{ text: 'Context' }] },
        });
        // @ts-ignore
        mockOverride.format.mockReturnValue({ messages: [{ role: 'user', content: 'Format this transcript' }] });
        // @ts-ignore
        mockOpenAI.createCompletion.mockResolvedValue('# Formatted Transcript\n\nTranscribed text');

        // Execute
        const transcribe = await importTranscribe();
        // @ts-ignore
        const instance = transcribe.create(config, mockOperator);
        const result = await instance.transcribe(creation, outputPath, contextPath, interimPath, filename, hash, audioFile);

        // Verify
        expect(mockStorage.exists).toHaveBeenCalledWith(path.join(interimPath, 'transcript_abc123.json'));
        expect(mockMedia.getFileSize).toHaveBeenCalledWith(audioFile);
        expect(mockOpenAI.transcribeAudio).toHaveBeenCalledWith(audioFile, {
            model: 'whisper-1',
            debug: false,
            debugFile: undefined
        });
        expect(mockStorage.writeFile).toHaveBeenCalledWith(
            path.join(interimPath, 'transcript_abc123.json'),
            expect.any(String),
            'utf8'
        );
        expect(mockPrompts.createTranscribePrompt).toHaveBeenCalledWith('transcribed text');
        expect(mockOpenAI.createCompletion).toHaveBeenCalled();
        expect(mockStorage.writeFile).toHaveBeenCalledWith(
            path.join(outputPath, 'transcript_abc123.md'),
            '# Formatted Transcript\n\nTranscribed text',
            'utf8'
        );
        expect(result).toEqual({ text: 'transcribed text' });
    });

    test('should split and transcribe large audio files', async () => {
        // Setup
        // @ts-ignore
        mockStorage.exists.mockResolvedValue(false);
        // @ts-ignore
        mockMedia.getFileSize.mockResolvedValue(1024 * 1024 * 30); // 30MB (larger than maxAudioSize)
        // @ts-ignore
        mockMedia.splitAudioFile.mockResolvedValue(['/tmp/chunk1.mp3', '/tmp/chunk2.mp3']);
        // @ts-ignore
        mockOpenAI.transcribeAudio
            // @ts-ignore
            .mockResolvedValueOnce({ text: 'transcribed chunk 1' })
            // @ts-ignore
            .mockResolvedValueOnce({ text: 'transcribed chunk 2' });
        // @ts-ignore
        mockPrompts.createTranscribePrompt.mockResolvedValue({
            persona: { items: [{ text: 'Persona' }] },
            instructions: { items: [{ text: 'Instructions' }] },
            contents: { items: [{ text: 'Content' }] },
            contexts: { items: [{ text: 'Context' }] },
        });
        // @ts-ignore
        mockOverride.format.mockReturnValue({ messages: [{ role: 'user', content: 'Format this transcript' }] });
        // @ts-ignore
        mockOpenAI.createCompletion.mockResolvedValue('# Formatted Transcript\n\nTranscribed text');

        // Execute
        const transcribe = await importTranscribe();
        // @ts-ignore
        const instance = transcribe.create(config, mockOperator);
        const result = await instance.transcribe(creation, outputPath, contextPath, interimPath, filename, hash, audioFile);

        // Verify
        expect(mockMedia.getFileSize).toHaveBeenCalledWith(audioFile);
        expect(mockMedia.splitAudioFile).toHaveBeenCalledWith(audioFile, path.join(config.tempDirectory, `split_audio_${hash}`), config.maxAudioSize);
        expect(mockOpenAI.transcribeAudio).toHaveBeenCalledTimes(2);
        expect(mockPrompts.createTranscribePrompt).toHaveBeenCalledWith('transcribed chunk 1 transcribed chunk 2');
        expect(result.text).toBe('transcribed chunk 1 transcribed chunk 2');
    });

    test('should handle errors when required parameters are missing', async () => {
        // Setup
        const transcribe = await importTranscribe();
        // @ts-ignore
        const instance = transcribe.create(config, mockOperator);

        // Execute & Verify
        await expect(instance.transcribe(creation, '', contextPath, interimPath, filename, hash, audioFile))
            .rejects.toThrow('outputPath is required for transcribe function');

        await expect(instance.transcribe(creation, outputPath, contextPath, interimPath, filename, hash, ''))
            .rejects.toThrow('audioFile is required for transcribe function');
    });

    test('should handle debug mode with appropriate debug files', async () => {
        // Setup
        const debugConfig = { ...config, debug: true };
        // @ts-ignore
        mockStorage.exists.mockResolvedValue(false);
        // @ts-ignore
        mockMedia.getFileSize.mockResolvedValue(1024 * 1024); // 1MB
        // @ts-ignore
        mockOpenAI.transcribeAudio.mockResolvedValue({ text: 'transcribed text' });

        // Execute
        const transcribe = await importTranscribe();
        // @ts-ignore
        const instance = transcribe.create(debugConfig, mockOperator);
        await instance.transcribe(creation, outputPath, contextPath, interimPath, filename, hash, audioFile);

        // Verify
        expect(mockOpenAI.transcribeAudio).toHaveBeenCalledWith(audioFile, {
            model: 'whisper-1',
            debug: true,
            debugFile: expect.stringContaining('interim/transcript_abc123.transcription.raw.response.json')
        });
    });

    test('should append .json extension if filename from operator does not have it', async () => {
        // Setup
        // @ts-ignore
        mockStorage.exists.mockResolvedValue(false);
        // @ts-ignore
        mockMedia.getFileSize.mockResolvedValue(1024 * 1024); // 1MB
        // @ts-ignore
        mockOpenAI.transcribeAudio.mockResolvedValue({ text: 'transcribed text' });
        // @ts-ignore
        mockOperator.constructFilename.mockResolvedValue('transcript_abc123'); // No extension

        // Execute
        const transcribe = await importTranscribe();
        // @ts-ignore
        const instance = transcribe.create(config, mockOperator);
        await instance.transcribe(creation, outputPath, contextPath, interimPath, filename, hash, audioFile);

        // Verify
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining('constructFilename did not return a .json file'),
            'transcript_abc123'
        );
        expect(mockStorage.exists).toHaveBeenCalledWith(path.join(interimPath, 'transcript_abc123.json'));
    });

    test('should skip creating markdown file if it already exists', async () => {
        // Setup
        // @ts-ignore
        mockStorage.exists
            // @ts-ignore
            .mockResolvedValueOnce(false) // For transcript.json
            // @ts-ignore
            .mockResolvedValueOnce(true);  // For transcript.md
        // @ts-ignore
        mockMedia.getFileSize.mockResolvedValue(1024 * 1024); // 1MB
        // @ts-ignore
        mockOpenAI.transcribeAudio.mockResolvedValue({ text: 'transcribed text' });

        // Execute
        const transcribe = await importTranscribe();
        // @ts-ignore
        const instance = transcribe.create(config, mockOperator);
        await instance.transcribe(creation, outputPath, contextPath, interimPath, filename, hash, audioFile);

        // Verify
        expect(mockPrompts.createTranscribePrompt).not.toHaveBeenCalled();
        expect(mockOpenAI.createCompletion).not.toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining('Markdown transcription file'),
            expect.any(String)
        );
    });
});
