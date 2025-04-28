import * as Cabazooka from "@tobrien/cabazooka";
import * as GiveMeTheConfig from '@tobrien/givemetheconfig';
import { Command } from "commander";
import {
    ALLOWED_MODELS,
    ALLOWED_TRANSCRIPTION_MODELS,
    CORTALYNE_DEFAULTS,
    DEFAULT_MAX_AUDIO_SIZE,
    PROGRAM_NAME,
    VERSION
} from "./constants";
import { Args, Config, SecureConfig } from "./cortalyne";
import { getLogger } from "./logging";
import * as Storage from "./util/storage";

export const configure = async (cabazooka: Cabazooka.Cabazooka, givemetheconfig: GiveMeTheConfig.Givemetheconfig<any>): Promise<[Config, SecureConfig]> => {
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

    await cabazooka.configure(program);
    program = await givemetheconfig.configure(program);
    program.version(VERSION);

    program.parse();

    const cliArgs: Args = program.opts<Args>();
    logger.info('Loaded Command Line Options: %s', JSON.stringify(cliArgs, null, 2));

    // Get values from config file first
    // Validate that the configuration read from the file is valid.
    const fileValues = await givemetheconfig.read(cliArgs);
    await givemetheconfig.validate(fileValues);

    // Read the Raw values from the Cabazooka Command Line Arguments
    const cabazookaValues = await cabazooka.read(cliArgs);

    let mergedConfig: Partial<Config> = {
        ...CORTALYNE_DEFAULTS,    // Start with Cortalyne defaults
        ...fileValues,   // Apply file values (overwrites defaults), ensure object
        ...cabazookaValues,              // Apply all CLI args last (highest precedence for all keys, including Cabazooka's)
    } as Partial<Config>;

    const secureConfig: SecureConfig = {
        ...(process.env.OPENAI_API_KEY !== undefined && { openaiApiKey: process.env.OPENAI_API_KEY }), // Apply Env vars
    } as SecureConfig;

    // Convert maxAudioSize if it's a string AFTER merging
    if (typeof mergedConfig.maxAudioSize === 'string') {
        const parsedSize = parseInt(mergedConfig.maxAudioSize, 10);
        if (!isNaN(parsedSize)) {
            mergedConfig.maxAudioSize = parsedSize;
        } else {
            logger.warn(`Invalid maxAudioSize value detected after merge: '${mergedConfig.maxAudioSize}', using default: ${DEFAULT_MAX_AUDIO_SIZE}`);
            mergedConfig.maxAudioSize = DEFAULT_MAX_AUDIO_SIZE; // Use Cortalyne default if parsing fails
        }
    } else if (mergedConfig.maxAudioSize === undefined) {
        // If still undefined after all merges, apply Cortalyne default
        mergedConfig.maxAudioSize = DEFAULT_MAX_AUDIO_SIZE;
    }

    // Apply Cabazooka defaults
    mergedConfig = cabazooka.applyDefaults(mergedConfig) as Partial<Config>;

    const config = mergedConfig as Config;

    // Validate Cabazooka final config
    cabazooka.validate(config);

    // Validate Cortalyne final config
    await validateConfig(config);
    await validateSecureConfig(secureConfig);

    logger.info('Final configuration: %s', JSON.stringify(config, null, 2));
    return [config, secureConfig];
}

async function validateSecureConfig(config: SecureConfig): Promise<void> {
    const logger = getLogger();
    if (!config.openaiApiKey) {
        config.openaiApiKey = process.env.OPENAI_API_KEY;

        if (!config.openaiApiKey) {
            throw new Error('OpenAI API key is required. Provide it via CLI (--openai-api-key), config file, or OPENAI_API_KEY environment variable.');
        }
        logger.debug("Using OpenAI API key from environment variable.");
    }
}

async function validateConfig(config: Config): Promise<void> {
    const logger = getLogger();

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
