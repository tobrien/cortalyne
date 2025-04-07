import ffmpeg from 'fluent-ffmpeg';
import { Logger } from 'winston';

export interface Media {
    getAudioCreationTime: (filePath: string) => Promise<Date | null>;
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

    return {
        getAudioCreationTime,
    }
}
