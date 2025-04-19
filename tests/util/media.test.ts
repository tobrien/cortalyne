import { jest } from '@jest/globals';

// Mock ffmpeg module
const mockFfprobe = jest.fn();
jest.unstable_mockModule('fluent-ffmpeg', () => ({
    default: {
        ffprobe: mockFfprobe
    }
}));

// Mock winston logger
const mockLogger = {
    debug: jest.fn(),
    error: jest.fn()
};

// Add type for ffprobe callback
type FfprobeCallback = (err: Error | null, metadata: any) => void;

// Import the module under test (must be after mocks)
let mediaUtil: any;
let create: any;

describe('media util', () => {
    beforeAll(async () => {
        // Import the module after mocks are set up
        const mediaModule = await import('../../src/util/media.js');
        create = mediaModule.create;

        // Create the media utility instance with mocked logger
        mediaUtil = create(mockLogger);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAudioCreationTime', () => {
        const testFilePath = '/path/to/audio.mp3';

        it('should extract creation time from format tags', async () => {
            // Mock ffprobe to return metadata with creation_time in format tags
            const creationTime = '2023-01-01T12:00:00.000Z';
            mockFfprobe.mockImplementationOnce((...args: any[]) => {
                const [path, callback] = args;
                expect(path).toBe(testFilePath);
                callback(null, {
                    format: {
                        tags: {
                            creation_time: creationTime
                        }
                    }
                });
            });

            const result = await mediaUtil.getAudioCreationTime(testFilePath);

            expect(mockFfprobe).toHaveBeenCalledWith(testFilePath, expect.any(Function));
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Found creation_time in format tags: %s',
                creationTime
            );
            expect(result).toEqual(new Date(creationTime));
        });

        it('should extract creation time from stream tags if not in format tags', async () => {
            // Mock ffprobe to return metadata with creation_time in stream tags
            const creationTime = '2023-02-01T12:00:00.000Z';
            mockFfprobe.mockImplementationOnce((...args: any[]) => {
                const [path, callback] = args;
                expect(path).toBe(testFilePath);
                callback(null, {
                    format: { tags: {} },
                    streams: [
                        { tags: {} },
                        { tags: { creation_time: creationTime } }
                    ]
                });
            });

            const result = await mediaUtil.getAudioCreationTime(testFilePath);

            expect(mockFfprobe).toHaveBeenCalledWith(testFilePath, expect.any(Function));
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'Found creation_time in stream tags: %s',
                creationTime
            );
            expect(result).toEqual(new Date(creationTime));
        });

        it('should return null if no creation time is found', async () => {
            // Mock ffprobe to return metadata without creation_time
            mockFfprobe.mockImplementationOnce((...args: any[]) => {
                const [path, callback] = args;
                expect(path).toBe(testFilePath);
                callback(null, {
                    format: { tags: {} },
                    streams: [
                        { tags: {} }
                    ]
                });
            });

            const result = await mediaUtil.getAudioCreationTime(testFilePath);

            expect(mockFfprobe).toHaveBeenCalledWith(testFilePath, expect.any(Function));
            expect(mockLogger.debug).toHaveBeenCalledWith(
                'No creation_time found in audio file metadata'
            );
            expect(result).toBeNull();
        });

        it('should handle errors when extracting creation time', async () => {
            // Mock ffprobe to throw an error
            const error = new Error('ffprobe error');
            mockFfprobe.mockImplementationOnce((...args: any[]) => {
                const [path, callback] = args;
                expect(path).toBe(testFilePath);
                callback(error, null);
            });

            const result = await mediaUtil.getAudioCreationTime(testFilePath);

            expect(mockFfprobe).toHaveBeenCalledWith(testFilePath, expect.any(Function));
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error extracting creation time from audio file: %s',
                error
            );
            expect(result).toBeNull();
        });
    });
});
