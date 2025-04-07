#!/usr/bin/env node
import 'dotenv/config';
import * as Arguments from './arguments';
import { PROGRAM_NAME, VERSION } from './constants';
import { getLogger, setLogLevel } from './logging';
import * as Process from './process';
import { Instance as ProcessInstance } from './process.d';
import { Config as RunConfig } from './run.d';
import * as Storage from './util/storage';

export async function main() {

    // eslint-disable-next-line no-console
    console.info(`Starting ${PROGRAM_NAME}: ${VERSION}`);

    const [runConfig]: [RunConfig] = await Arguments.configure();

    // Set log level based on verbose flag
    if (runConfig.verbose) {
        setLogLevel('verbose');
    }
    if (runConfig.debug) {
        setLogLevel('debug');
    }

    const logger = getLogger();

    try {

        // Look through all files in the input directory
        const inputDirectory = runConfig.inputDirectory;

        const storage: Storage.Utility = Storage.create({ log: logger.debug });

        const process: ProcessInstance = Process.create(runConfig);

        const filePattern = `${runConfig.recursive ? '**/' : ''}*.{${runConfig.audioExtensions.join(',')}}`;

        logger.info('Processing files in %s with pattern %s', inputDirectory, filePattern);
        let fileCount = 0;
        await storage.forEachFileIn(inputDirectory, async (file: string) => {
            logger.verbose('Processing file %s', file);
            await process.process(file);
            fileCount++;
        }, { pattern: filePattern });

        logger.info('Processed %d files', fileCount);
    } catch (error: any) {
        logger.error('Exiting due to Error: %s, %s', error.message, error.stack);
        process.exit(1);
    }
}

main();