import ffmpeg from 'fluent-ffmpeg';
import { Logger } from 'winston';
import path from 'path';
import * as Storage from './storage';

export interface Media {
    getAudioCreationTime: (filePath: string) => Promise<Date | null>;
    getFileSize: (filePath: string) => Promise<number>;
    splitAudioFile: (filePath: string, outputDir: string, maxSizeBytes: number) => Promise<string[]>;
}

const ffprobeAsync = (filePath: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata);
        });
    });
};


export const create = (logger: Logger): Media => {
    const storage = Storage.create({ log: logger.debug });

    // Extract creation time from audio file using ffmpeg
    const getAudioCreationTime = async (filePath: string): Promise<Date | null> => {
        try {
            const metadata = await ffprobeAsync(filePath);

            // Look for creation_time in format tags
            const formatTags = metadata?.format?.tags;
            if (formatTags?.creation_time) {
                logger.debug('Found creation_time in format tags: %s', formatTags.creation_time);
                return new Date(formatTags.creation_time);
            }

            // Check for creation_time in stream tags as fallback
            if (metadata?.streams?.length > 0) {
                for (const stream of metadata.streams) {
                    if (stream.tags?.creation_time) {
                        logger.debug('Found creation_time in stream tags: %s', stream.tags.creation_time);
                        return new Date(stream.tags.creation_time);
                    }
                }
            }

            logger.debug('No creation_time found in audio file metadata');
            return null;
        } catch (error) {
            logger.error('Error extracting creation time from audio file: %s', error);
            return null;
        }
    };

    // Get file size in bytes
    const getFileSize = async (filePath: string): Promise<number> => {
        try {
            return await storage.getFileSize(filePath);
        } catch (error) {
            logger.error('Error getting file size: %s', error);
            throw new Error(`Failed to get file size for ${filePath}: ${error}`);
        }
    };

    // Split large audio file into smaller chunks
    const splitAudioFile = async (filePath: string, outputDir: string, maxSizeBytes: number): Promise<string[]> => {
        try {
            const metadata = await ffprobeAsync(filePath);
            const duration = parseFloat(metadata.format.duration);

            // Calculate how many segments we need based on file size and max size
            const fileSize = await getFileSize(filePath);
            const segmentCount = Math.ceil(fileSize / maxSizeBytes);

            // Calculate segment duration
            const segmentDuration = duration / segmentCount;
            logger.debug(`Splitting ${filePath} (${fileSize} bytes) into ${segmentCount} segments of ~${segmentDuration} seconds each`);

            // Create output directory if it doesn't exist
            await storage.createDirectory(outputDir);

            const outputFiles: string[] = [];
            const fileExt = path.extname(filePath);
            const fileName = path.basename(filePath, fileExt);

            // Create a promise for each segment
            const promises = [];

            for (let i = 0; i < segmentCount; i++) {
                const startTime = i * segmentDuration;
                const outputPath = path.join(outputDir, `${fileName}_part${i + 1}${fileExt}`);
                outputFiles.push(outputPath);

                const promise = new Promise<void>((resolve, reject) => {
                    ffmpeg(filePath)
                        .setStartTime(startTime)
                        .setDuration(segmentDuration)
                        .output(outputPath)
                        .on('end', () => {
                            logger.debug(`Created segment ${i + 1}/${segmentCount}: ${outputPath}`);
                            resolve();
                        })
                        .on('error', (err) => {
                            logger.error(`Error creating segment ${i + 1}/${segmentCount}: ${err}`);
                            reject(err);
                        })
                        .run();
                });

                promises.push(promise);
            }

            // Wait for all segments to be created
            await Promise.all(promises);
            return outputFiles;
        } catch (error) {
            logger.error('Error splitting audio file: %s', error);
            throw new Error(`Failed to split audio file ${filePath}: ${error}`);
        }
    };

    return {
        getAudioCreationTime,
        getFileSize,
        splitAudioFile,
    }
}
