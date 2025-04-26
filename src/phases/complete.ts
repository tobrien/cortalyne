import * as path from 'path';
import * as Logging from '../logging';
import { Config } from '../cortalyne';
import * as Storage from '../util/storage';

export interface Instance {
    complete(classifiedType: string, subject: string, hash: string, creationTime: Date, audioFile: string): Promise<string>;
}

export const create = (config: Config): Instance => {
    const logger = Logging.getLogger();
    const storage = Storage.create({ log: logger.info });

    const formatDate = (date: Date): string => {
        // Format: YYYY-M-D
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are 0-based
        const day = date.getDate();
        return `${year}-${month}-${day}`;
    };

    const complete = async (classifiedType: string, subject: string, hash: string, creationTime: Date, audioFile: string): Promise<string> => {
        logger.debug('Completing file processing for %s', audioFile);

        if (config.dryRun) {
            logger.info('Dry run, skipping file movement for %s', audioFile);
            return audioFile;
        }

        // Create the processed directory if it doesn't exist
        if (!await storage.exists(config.processedDirectory)) {
            logger.debug('Creating processed directory %s', config.processedDirectory);
            await storage.createDirectory(config.processedDirectory);
        }

        // Get the file extension
        const fileExt = path.extname(audioFile);

        // Format date for filename YYYY-M-D
        const dateStr = formatDate(creationTime);

        // Create new filename: YYYY-M-D-<hash>-<type>-<subject>
        // Clean subject by removing special characters and spaces
        const cleanSubject = subject.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const newFilename = `${dateStr}-${hash}-${classifiedType}-${cleanSubject}${fileExt}`;
        const newFilePath = path.join(config.processedDirectory, newFilename);

        // Read the original file
        const fileContent = await storage.readFile(audioFile, 'binary');

        // Write to the new location
        logger.debug('Moving file from %s to %s', audioFile, newFilePath);
        await storage.writeFile(newFilePath, fileContent, 'binary');

        // Remove the original file
        await storage.deleteFile(audioFile);

        logger.info('Moved file to %s', newFilePath);
        return newFilePath;
    };

    return {
        complete,
    };
}; 