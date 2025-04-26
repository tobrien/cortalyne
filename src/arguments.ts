import * as Cabazooka from "@tobrien/cabazooka";
import * as GiveMeTheConfig from '@tobrien/givemetheconfig';
import { Command } from "commander";
import os from 'os';
import {
    ALLOWED_MODELS,
    ALLOWED_TRANSCRIPTION_MODELS,
    DEFAULT_DEBUG,
    DEFAULT_DRY_RUN,
    DEFAULT_MAX_AUDIO_SIZE,
    DEFAULT_MODEL,
    DEFAULT_OVERRIDES,
    DEFAULT_PROCESSED_DIR,
    DEFAULT_TEMP_DIRECTORY,
    DEFAULT_TRANSCRIPTION_MODEL,
    DEFAULT_VERBOSE,
    PROGRAM_NAME,
    VERSION,
} from "./constants";
import { Config } from "./cortalyne";
import { getLogger } from "./logging";
import * as Storage from "./util/storage";
import { z } from "zod";
import { DEFAULT_CONFIG_DIRECTORY } from "@tobrien/givemetheconfig";

export interface Args extends Cabazooka.Args, GiveMeTheConfig.Args {
    dryRun?: boolean;
    verbose?: boolean;
    debug?: boolean;
    transcriptionModel?: string;
    model?: string;
    openaiApiKey?: string;
    overrides?: boolean;
    processedDirectory?: string;
    classifyModel?: string;
    composeModel?: string;
    contextDirectories?: string[];
    maxAudioSize?: number | string;
    tempDirectory?: string;
}

export const configure = async <T extends z.ZodTypeAny>(cabazooka: Cabazooka.Cabazooka, givemetheconfig: GiveMeTheConfig.Givemetheconfig<T>): Promise<[Config]> => {
    const logger = getLogger();

    let program = new Command();
    program
        .name(PROGRAM_NAME)
        .summary('Create Intelligent Release Notes or Change Logs from Git')
        .description('Create Intelligent Release Notes or Change Logs from Git')
        .option('--dry-run', 'perform a dry run without saving files')
        .option('--verbose', 'enable verbose logging')
        .option('--debug', 'enable debug logging')
        .option('--openai-api-key <openaiApiKey>', 'OpenAI API key')
        .option('--transcription-model <transcriptionModel>', 'OpenAI transcription model to use')
        .option('--model <model>', 'OpenAI model to use')
        .option('--processed-directory <processedDirectory>', 'directory for processed audio files')
        .option('--overrides', 'allow overrides of the default configuration')
        .option('--classify-model <classifierModel>', 'classifier model to use')
        .option('--compose-model <composeModel>', 'compose model to use')
        .option('--context-directories [contextDirectories...]', 'directories containing context files to be included in prompts')
        .option('--max-audio-size <maxAudioSize>', 'maximum audio file size in bytes')
        .option('--temp-directory <tempDirectory>', 'temporary directory for processing files')

    program = await cabazooka.configure(program);
    program = await givemetheconfig.configure(program);
    program.version(VERSION);

    program.parse();

    const cliArgs: Args = program.opts<Args>();
    logger.debug('Raw CLI args: %s', JSON.stringify(cliArgs, null, 2));

    const fileValues = await givemetheconfig.getValuesFromFile(cliArgs);
    logger.debug('Raw file config values: %s', JSON.stringify(fileValues, null, 2));

    const mergedConfig: Partial<Config> = {
        dryRun: DEFAULT_DRY_RUN,
        verbose: DEFAULT_VERBOSE,
        debug: DEFAULT_DEBUG,
        transcriptionModel: DEFAULT_TRANSCRIPTION_MODEL,
        model: DEFAULT_MODEL,
        processedDirectory: DEFAULT_PROCESSED_DIR,
        overrides: DEFAULT_OVERRIDES,
        maxAudioSize: DEFAULT_MAX_AUDIO_SIZE,
        tempDirectory: DEFAULT_TEMP_DIRECTORY || os.tmpdir(),
        classifyModel: DEFAULT_MODEL,
        composeModel: DEFAULT_MODEL,
        // @ts-expect-error - configDirectory is not part of the Config type
        configDirectory: fileValues.configDirectory || DEFAULT_CONFIG_DIRECTORY,

        ...(fileValues?.dryRun !== undefined && { dryRun: fileValues.dryRun }),
        ...(fileValues?.verbose !== undefined && { verbose: fileValues.verbose }),
        ...(fileValues?.debug !== undefined && { debug: fileValues.debug }),
        ...(fileValues?.openaiApiKey !== undefined && { openaiApiKey: fileValues.openaiApiKey }),
        ...(fileValues?.transcriptionModel !== undefined && { transcriptionModel: fileValues.transcriptionModel }),
        ...(fileValues?.model !== undefined && { model: fileValues.model }),
        ...(fileValues?.processedDirectory !== undefined && { processedDirectory: fileValues.processedDirectory }),
        ...(fileValues?.overrides !== undefined && { overrides: fileValues.overrides }),
        ...(fileValues?.classifyModel !== undefined && { classifyModel: fileValues.classifyModel }),
        ...(fileValues?.composeModel !== undefined && { composeModel: fileValues.composeModel }),
        ...(fileValues?.contextDirectories !== undefined && { contextDirectories: fileValues.contextDirectories }),
        ...(fileValues?.maxAudioSize !== undefined && typeof fileValues.maxAudioSize === 'number' && { maxAudioSize: fileValues.maxAudioSize }),
        ...(fileValues?.maxAudioSize !== undefined && typeof fileValues.maxAudioSize === 'string' && { maxAudioSize: parseInt(fileValues.maxAudioSize, 10) }),
        ...(fileValues?.tempDirectory !== undefined && { tempDirectory: fileValues.tempDirectory }),

        ...(process.env.OPENAI_API_KEY !== undefined && { openaiApiKey: process.env.OPENAI_API_KEY }),

        ...(cliArgs.dryRun !== undefined && { dryRun: cliArgs.dryRun }),
        ...(cliArgs.verbose !== undefined && { verbose: cliArgs.verbose }),
        ...(cliArgs.debug !== undefined && { debug: cliArgs.debug }),
        ...(cliArgs.openaiApiKey !== undefined && { openaiApiKey: cliArgs.openaiApiKey }),
        ...(cliArgs.transcriptionModel !== undefined && { transcriptionModel: cliArgs.transcriptionModel }),
        ...(cliArgs.model !== undefined && { model: cliArgs.model }),
        ...(cliArgs.processedDirectory !== undefined && { processedDirectory: cliArgs.processedDirectory }),
        ...(cliArgs.overrides !== undefined && { overrides: cliArgs.overrides }),
        ...(cliArgs.classifyModel !== undefined && { classifyModel: cliArgs.classifyModel }),
        ...(cliArgs.composeModel !== undefined && { composeModel: cliArgs.composeModel }),
        ...(cliArgs.contextDirectories !== undefined && { contextDirectories: cliArgs.contextDirectories }),
        ...(cliArgs.maxAudioSize !== undefined && typeof cliArgs.maxAudioSize === 'number' && { maxAudioSize: cliArgs.maxAudioSize }),
        ...(cliArgs.maxAudioSize !== undefined && typeof cliArgs.maxAudioSize === 'string' && { maxAudioSize: parseInt(cliArgs.maxAudioSize, 10) }),
        ...(cliArgs.tempDirectory !== undefined && { tempDirectory: cliArgs.tempDirectory }),
    };

    if (typeof mergedConfig.maxAudioSize === 'string') {
        mergedConfig.maxAudioSize = parseInt(mergedConfig.maxAudioSize, 10);
        if (isNaN(mergedConfig.maxAudioSize)) {
            logger.warn(`Invalid maxAudioSize value detected after merge, using default: ${DEFAULT_MAX_AUDIO_SIZE}`);
            mergedConfig.maxAudioSize = DEFAULT_MAX_AUDIO_SIZE;
        }
    } else if (mergedConfig.maxAudioSize === undefined) {
        mergedConfig.maxAudioSize = DEFAULT_MAX_AUDIO_SIZE;
    }

    const cabazookaKeys = Object.keys(cliArgs).filter(k => k in Cabazooka.ConfigSchema.shape);
    for (const key of cabazookaKeys) {
        if (cliArgs[key as keyof Args] !== undefined) {
            mergedConfig[key as keyof Config] = cliArgs[key as keyof Args] as any;
        }
        else if (fileValues?.[key as keyof Args] !== undefined) {
            mergedConfig[key as keyof Config] = fileValues[key as keyof Args] as any;
        }
    }

    const finalConfig = mergedConfig as Config;
    logger.debug('Final merged config: %s', JSON.stringify(finalConfig, null, 2));

    await validateFinalConfig(finalConfig);

    return [finalConfig];
}

async function validateFinalConfig(config: Config): Promise<void> {
    const logger = getLogger();

    // @ts-expect-error - openaiApiKey is not part of the Config type
    if (!config.openaiApiKey) {
        // @ts-expect-error - openaiApiKey is not part of the Config type
        config.openaiApiKey = process.env.OPENAI_API_KEY;

        // @ts-expect-error - openaiApiKey is not part of the Config type
        if (!config.openaiApiKey) {
            throw new Error('OpenAI API key is required. Provide it via CLI (--openai-api-key), config file, or OPENAI_API_KEY environment variable.');
        }
        logger.debug("Using OpenAI API key from environment variable.");
    }

    validateModel(config.model, true, 'model', ALLOWED_MODELS);
    validateModel(config.transcriptionModel, true, 'transcriptionModel', ALLOWED_TRANSCRIPTION_MODELS);
    validateModel(config.classifyModel, false, 'classifyModel', ALLOWED_MODELS);
    validateModel(config.composeModel, false, 'composeModel', ALLOWED_MODELS);

    if (config.contextDirectories && config.contextDirectories.length > 0) {
        await validateContextDirectories(config.contextDirectories);
    } else {
        logger.debug("No context directories provided.");
        config.contextDirectories = [];
    }

    if (config.processedDirectory) {
        await validateProcessedDirectory(config.processedDirectory);
    } else {
        throw new Error('Processed directory is required.');
    }

    if (config.tempDirectory) {
        await validateTempDirectory(config.tempDirectory);
    } else {
        throw new Error('Temp directory is required.');
    }

    if (typeof config.maxAudioSize !== 'number' || config.maxAudioSize <= 0) {
        throw new Error(`Invalid maxAudioSize: ${config.maxAudioSize}. Must be a positive number.`);
    }

    logger.info("Final configuration validated successfully.");
}

function validateModel(model: string | undefined, required: boolean, modelOptionName: string, allowedModels: string[]) {
    const logger = getLogger();
    logger.debug(`Validating model for ${modelOptionName}: ${model} (Required: ${required})`);
    if (required && !model) {
        throw new Error(`Model for ${modelOptionName} is required`);
    }

    if (model && !allowedModels.includes(model)) {
        throw new Error(`Invalid ${modelOptionName}: ${model}. Allowed models are: ${allowedModels.join(', ')}`);
    }
}

async function validateContextDirectories(contextDirectories: string[]) {
    const logger = getLogger();
    logger.debug(`Validating context directories: ${contextDirectories.join(', ')}`);
    const storage = Storage.create({ log: logger.info.bind(logger) });
    for (const directory of contextDirectories) {
        if (!await storage.isDirectoryReadable(directory)) {
            throw new Error(`Context directory does not exist or is not readable: ${directory}`);
        }
    }
}

async function validateProcessedDirectory(processedDirectory: string) {
    const logger = getLogger();
    logger.debug(`Validating processed directory: ${processedDirectory}`);
    const storage = Storage.create({ log: logger.info.bind(logger) });
    if (!await storage.isDirectoryWritable(processedDirectory)) {
        throw new Error(`Processed directory does not exist or is not writable: ${processedDirectory}`);
    }
}

async function validateTempDirectory(tempDirectory: string) {
    const logger = getLogger();
    logger.debug(`Validating temp directory: ${tempDirectory}`);
    const storage = Storage.create({ log: logger.info.bind(logger) });
    if (!await storage.isDirectoryWritable(tempDirectory)) {
        throw new Error(`Temp directory does not exist or is not writable: ${tempDirectory}`);
    }
}
