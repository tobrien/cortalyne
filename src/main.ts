#!/usr/bin/env node
import * as Cabazooka from '@tobrien/cabazooka';
import 'dotenv/config';
import * as Arguments from './arguments';
import { ALLOWED_AUDIO_EXTENSIONS, ALLOWED_FILENAME_OPTIONS, ALLOWED_OUTPUT_STRUCTURES, DEFAULT_AUDIO_EXTENSIONS, DEFAULT_FILENAME_OPTIONS, DEFAULT_INPUT_DIRECTORY, DEFAULT_OUTPUT_DIRECTORY, DEFAULT_OUTPUT_STRUCTURE, DEFAULT_TIMEZONE, PROGRAM_NAME, VERSION } from './constants';
import { getLogger, setLogLevel } from './logging';
import * as Processor from './processor';

export interface Config extends Cabazooka.Config {
    dryRun: boolean;
    verbose: boolean;
    debug: boolean;
    diff: boolean;
    log: boolean;
    model: string;
    transcriptionModel: string;
    contentTypes: string[];
    configDir: string;
    overrides: boolean;
    classifyModel: string;
    composeModel: string;
    contextDirectories?: string[];
}

export async function main() {

    // eslint-disable-next-line no-console
    console.info(`Starting ${PROGRAM_NAME}: ${VERSION}`);


    const cabazookaOptions: Cabazooka.Options = {
        defaults: {
            timezone: DEFAULT_TIMEZONE,
            extensions: DEFAULT_AUDIO_EXTENSIONS,
            outputStructure: DEFAULT_OUTPUT_STRUCTURE,
            filenameOptions: DEFAULT_FILENAME_OPTIONS,
            inputDirectory: DEFAULT_INPUT_DIRECTORY,
            outputDirectory: DEFAULT_OUTPUT_DIRECTORY,
        },
        allowed: {
            extensions: ALLOWED_AUDIO_EXTENSIONS,
            outputStructures: ALLOWED_OUTPUT_STRUCTURES,
            filenameOptions: ALLOWED_FILENAME_OPTIONS,
        },
    }

    const cabazooka: Cabazooka.Instance = Cabazooka.create(cabazookaOptions);

    const [config]: [Config] = await Arguments.configure(cabazooka);

    // Set log level based on verbose flag
    if (config.verbose) {
        setLogLevel('verbose');
    }
    if (config.debug) {
        setLogLevel('debug');
    }

    const logger = getLogger();
    cabazooka.setLogger(logger);

    logger.debug('Debug logging enabled');
    logger.debug('Run config: %j', config);


    try {

        const operator: Cabazooka.Operator = await cabazooka.operate(config);
        const processor = Processor.create(config, operator);

        await operator.process(async (file: string) => {
            await processor.process(file);
        });
    } catch (error: any) {
        logger.error('Exiting due to Error: %s, %s', error.message, error.stack);
        process.exit(1);
    }
}

main();