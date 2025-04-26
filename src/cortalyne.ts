#!/usr/bin/env node
import 'dotenv/config';
import * as Arguments from './arguments';
import { ALLOWED_AUDIO_EXTENSIONS, ALLOWED_OUTPUT_FILENAME_OPTIONS, ALLOWED_OUTPUT_STRUCTURES, DEFAULT_AUDIO_EXTENSIONS, DEFAULT_OUTPUT_FILENAME_OPTIONS, DEFAULT_INPUT_DIRECTORY, DEFAULT_OUTPUT_DIRECTORY, DEFAULT_OUTPUT_STRUCTURE, DEFAULT_TIMEZONE, PROGRAM_NAME, VERSION, DEFAULT_CONFIG_DIR } from './constants';
import { getLogger, setLogLevel } from './logging';
import * as Processor from './processor';
import * as Cabazooka from '@tobrien/cabazooka';
import * as GiveMeTheConfig from '@tobrien/givemetheconfig';
import { z } from 'zod';

export const ConfigSchema = z.object({
    dryRun: z.boolean(),
    verbose: z.boolean(),
    debug: z.boolean(),
    diff: z.boolean(),
    log: z.boolean(),
    model: z.string(),
    transcriptionModel: z.string(),
    contentTypes: z.array(z.string()),
    overrides: z.boolean(),
    processedDirectory: z.string(),
    classifyModel: z.string(),
    composeModel: z.string(),
    contextDirectories: z.array(z.string()).optional(),
    maxAudioSize: z.number(),
    tempDirectory: z.string(),
});

export type Config = z.infer<typeof ConfigSchema> & Cabazooka.Config & GiveMeTheConfig.Config;


export async function main() {

    // eslint-disable-next-line no-console
    console.info(`Starting ${PROGRAM_NAME}: ${VERSION}`);

    const cabazookaOptions = Cabazooka.createOptions({
        defaults: {
            timezone: DEFAULT_TIMEZONE,
            extensions: DEFAULT_AUDIO_EXTENSIONS,
            outputStructure: DEFAULT_OUTPUT_STRUCTURE,
            outputFilenameOptions: DEFAULT_OUTPUT_FILENAME_OPTIONS,
            inputDirectory: DEFAULT_INPUT_DIRECTORY,
            outputDirectory: DEFAULT_OUTPUT_DIRECTORY,
        },
        allowed: {
            extensions: ALLOWED_AUDIO_EXTENSIONS,
            outputStructures: ALLOWED_OUTPUT_STRUCTURES,
            outputFilenameOptions: ALLOWED_OUTPUT_FILENAME_OPTIONS,
        },
        features: Cabazooka.DEFAULT_FEATURES,
        addDefaults: false,
    });

    const cabazooka = Cabazooka.create(cabazookaOptions);

    const mergedShapeProperties = {
        ...ConfigSchema.partial().shape,
        ...Cabazooka.ConfigSchema.partial().shape
    };
    // @ts-expect-error This isn't causing an error.
    const combinedShape = z.object(mergedShapeProperties);

    const givemetheconfigOptions = GiveMeTheConfig.createOptions({
        defaults: {
            configDirectory: DEFAULT_CONFIG_DIR,
        },
        configShape: combinedShape.shape,
        features: GiveMeTheConfig.DEFAULT_FEATURES,
    });

    const givemetheconfig = GiveMeTheConfig.create(givemetheconfigOptions);

    const [config]: [Config] = await Arguments.configure(cabazooka, givemetheconfig);

    // Set log level based on verbose flag
    if (config.verbose === true) {
        setLogLevel('verbose');
    }
    if (config.debug === true) {
        setLogLevel('debug');
    }

    const logger = getLogger();
    cabazooka.setLogger(logger);

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