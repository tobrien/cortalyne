import path from 'path';
import { DATE_FORMAT_DAY, DATE_FORMAT_MONTH, DATE_FORMAT_MONTH_DAY, DATE_FORMAT_YEAR, DATE_FORMAT_YEAR_MONTH_DAY } from './constants';
import * as Dates from './util/dates';
import * as Storage from './util/storage';
import { getLogger } from './logging';
import { FilenameOption, Output, OutputStructure } from './output.d';

export const create = (timezone: string, outputStructure: OutputStructure, filenameOptions: FilenameOption[]): Output => {
    const dates = Dates.create({ timezone });
    const logger = getLogger();
    const storage: Storage.Utility = Storage.create({ log: logger.debug });

    function formatDate(date: Date, outputStructure: 'none' | 'year' | 'month' | 'day'): string {
        switch (outputStructure) {
            case 'none':
                return dates.format(date, DATE_FORMAT_YEAR_MONTH_DAY);
            case 'year':
                return dates.format(date, DATE_FORMAT_MONTH_DAY);
            case 'month':
                return dates.format(date, DATE_FORMAT_DAY);
            case 'day':
                throw new Error('Cannot use date in filename when output structure is "day"');
        }
    }

    function sanitizeFilenameString(str: string): string {
        // Replace any character that is not alphanumeric, hyphen, underscore, or dot with an underscore
        return str.replace(/[^a-zA-Z0-9\-_.]/g, '_')
            // Replace multiple consecutive hyphens with a single hyphen
            .replace(/-+/g, '_')
            // Remove leading and trailing hyphens
            .replace(/^_+|_+$/g, '')
            // Ensure the string is not empty
            .replace(/^$/, 'untitled');
    }

    function constructFilename(
        date: Date,
        type: string,
        hash: string,
        options: {
            subject?: string;
        } = {}
    ): string {
        const parts: string[] = [];

        // Add date if requested
        if (filenameOptions?.includes('date')) {
            const dateStr = formatDate(date, outputStructure);
            parts.push(dateStr);
        }

        // Add time if requested
        if (filenameOptions?.includes('time')) {
            const dates = Dates.create({ timezone });
            const timeStr = dates.format(date, 'HHmm');
            parts.push(timeStr);
        }

        // Add message ID
        parts.push(hash);
        parts.push(type);
        if (options.subject) {
            parts.push(sanitizeFilenameString(options.subject));
        }

        return parts.join('-');
    }

    function constructOutputDirectory(creationTime: Date, baseDirectory: string) {
        const date = dates.date(creationTime);
        const year = dates.format(date, DATE_FORMAT_YEAR);
        const month = dates.format(date, DATE_FORMAT_MONTH);
        const day = dates.format(date, DATE_FORMAT_DAY);

        let outputPath: string;
        switch (outputStructure) {
            case 'year':
                outputPath = path.join(baseDirectory, year);
                break;
            case 'month':
                outputPath = path.join(baseDirectory, year, month);
                break;
            case 'day':
                outputPath = path.join(baseDirectory, year, month, day);
                break;
            default:
                outputPath = baseDirectory;
        }

        storage.createDirectory(outputPath);
        return outputPath;
    }

    return {
        constructFilename,
        constructOutputDirectory,
    }
}
