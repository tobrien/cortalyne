import { Command } from "commander";
import { Input } from "./arguments.d";
import { ALLOWED_AUDIO_EXTENSIONS, ALLOWED_FILENAME_OPTIONS, ALLOWED_OUTPUT_STRUCTURES, ALLOWED_MODELS, DEFAULT_AUDIO_EXTENSIONS, DEFAULT_CONFIG_DIR, DEFAULT_DEBUG, DEFAULT_DRY_RUN, DEFAULT_INPUT_DIRECTORY, DEFAULT_MODEL, DEFAULT_OUTPUT_DIRECTORY, DEFAULT_OVERRIDES, DEFAULT_RECURSIVE, DEFAULT_TIMEZONE, DEFAULT_TRANSCRIPTION_MODEL, DEFAULT_VERBOSE, PROGRAM_NAME, VERSION } from "./constants";
import { getLogger } from "./logging";
import * as Run from "./run";
import * as Storage from "./util/storage";
import { ArgumentError } from "./error/ArgumentError";
import { FilenameOption, OutputStructure } from "./output.d";
import { Config as RunConfig } from "./run.d";
import * as Dates from "./util/dates";
export const configure = async (): Promise<[RunConfig]> => {
    const program = new Command();

    program
        .name(PROGRAM_NAME)
        .summary('Create Intelligent Release Notes or Change Logs from Git')
        .description('Create Intelligent Release Notes or Change Logs from Git')
        .option('--dry-run', 'perform a dry run without saving files', DEFAULT_DRY_RUN)
        .option('--verbose', 'enable verbose logging', DEFAULT_VERBOSE)
        .option('--debug', 'enable debug logging', DEFAULT_DEBUG)
        .option('--timezone <timezone>', 'timezone for date calculations', DEFAULT_TIMEZONE)
        .option('--openai-api-key <openaiApiKey>', 'OpenAI API key', process.env.OPENAI_API_KEY)
        .option('--transcription-model <transcriptionModel>', 'OpenAI transcription model to use', DEFAULT_TRANSCRIPTION_MODEL)
        .option('--model <model>', 'OpenAI model to use', DEFAULT_MODEL)
        .option('-r, --recursive', 'recursive mode, process all files in the input directory', DEFAULT_RECURSIVE)
        .option('-o, --output-directory <outputDirectory>', 'output directory', DEFAULT_OUTPUT_DIRECTORY)
        .option('-i, --input-directory <inputDirectory>', 'input directory', DEFAULT_INPUT_DIRECTORY)
        .option('-a, --audio-extensions [audioExtensions...]', 'audio extensions to include in the summary', DEFAULT_AUDIO_EXTENSIONS)
        .option('--output-structure <type>', 'output directory structure (none/year/month/day)')
        .option('--filename-options [filenameOptions...]', 'filename format options (space-separated list of: date,time,subject) example \'date subject\'', ['date', 'time', 'subject'])
        .option('--config-dir <configDir>', 'config directory', DEFAULT_CONFIG_DIR)
        .option('--overrides', 'allow overrides of the default configuration', DEFAULT_OVERRIDES)
        .option('--classify-model <classifierModel>', 'classifier model to use')
        .option('--compose-model <composeModel>', 'compose model to use')
        .version(VERSION);

    program.parse();

    const options: Input = program.opts<Input>();

    const params = await validateOptions(options);

    // Create the run configuration
    const runConfig: RunConfig = Run.createConfig(params);

    return [runConfig];
}

async function validateOptions(options: Input): Promise<{
    dryRun: boolean;
    verbose: boolean;
    debug: boolean;
    model: string;
    transcriptionModel: string;
    recursive: boolean;
    timezone: string;
    inputDirectory: string;
    outputDirectory: string;
    audioExtensions: string[];
    configDir: string;
    overrides: boolean;
    classifyModel: string;
    composeModel: string;
}> {

    // Validate timezone
    const timezone: string = validateTimezone(options.timezone);


    if (!options.openaiApiKey) {
        throw new Error('OpenAI API key is required, set OPENAI_API_KEY environment variable');
    }


    if (!options.configDir) {
        await validateConfigDirectory(options.configDir);
    }

    if (!options.inputDirectory) {
        await validateInputDirectory(options.inputDirectory);
    }

    if (!options.outputDirectory) {
        await validateOutputDirectory(options.outputDirectory);
    }

    if (!options.audioExtensions) {
        await validateAudioExtensions(options.audioExtensions);
    }

    // Validate filename options if provided
    validateOutputStructure(options.outputStructure);
    validateFilenameOptions(options.filenameOptions, options.outputStructure as OutputStructure);

    validateModel(options.model, true, '--model');
    validateModel(options.classifyModel, false, '--classify-model');
    validateModel(options.composeModel, false, '--compose-model');

    return {
        dryRun: options.dryRun,
        verbose: options.verbose,
        debug: options.debug,
        model: options.model,
        transcriptionModel: options.transcriptionModel ?? DEFAULT_TRANSCRIPTION_MODEL,
        recursive: options.recursive ?? DEFAULT_RECURSIVE,
        timezone: timezone,
        inputDirectory: options.inputDirectory ?? DEFAULT_INPUT_DIRECTORY,
        outputDirectory: options.outputDirectory ?? DEFAULT_OUTPUT_DIRECTORY,
        audioExtensions: options.audioExtensions ?? DEFAULT_AUDIO_EXTENSIONS,
        configDir: options.configDir ?? DEFAULT_CONFIG_DIR,
        overrides: options.overrides ?? DEFAULT_OVERRIDES,
        classifyModel: options.classifyModel ?? DEFAULT_MODEL,
        composeModel: options.composeModel ?? DEFAULT_MODEL,
    };
}

function validateModel(model: string | undefined, required: boolean, modelOptionName: string) {
    if (required && !model) {
        throw new Error(`Model for ${modelOptionName} is required`);
    }

    if (model && !ALLOWED_MODELS.includes(model)) {
        throw new Error(`Invalid model: ${model}. Valid models are: ${ALLOWED_MODELS.join(', ')}`);
    }
}

async function validateConfigDirectory(configDir: string) {
    const logger = getLogger();
    const storage = Storage.create({ log: logger.info });
    if (!storage.isDirectoryReadable(configDir)) {
        throw new Error(`Config directory does not exist: ${configDir}`);
    }
}

async function validateInputDirectory(inputDirectory: string) {
    const logger = getLogger();
    const storage = Storage.create({ log: logger.info });
    if (!storage.isDirectoryReadable(inputDirectory)) {
        throw new Error(`Input directory does not exist: ${inputDirectory}`);
    }
}

async function validateOutputDirectory(outputDirectory: string) {
    const logger = getLogger();
    const storage = Storage.create({ log: logger.info });
    if (!storage.isDirectoryWritable(outputDirectory)) {
        throw new Error(`Output directory does not exist: ${outputDirectory}`);
    }
}

async function validateAudioExtensions(audioExtensions: string[]) {
    if (audioExtensions.some(audioExtension => !ALLOWED_AUDIO_EXTENSIONS.includes(audioExtension))) {
        throw new Error(`Invalid audio extension: ${audioExtensions.join(', ')}, allowed audio extensions: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`);
    }
}

export const validateOutputStructure = (outputStructure: string | undefined): void => {
    const validOptions = ALLOWED_OUTPUT_STRUCTURES;
    if (outputStructure && !validOptions.includes(outputStructure as OutputStructure)) {
        throw new ArgumentError('--output-structure', `Invalid output structure: ${outputStructure}. Valid options are: ${validOptions.join(', ')}`);
    }
}

export const validateFilenameOptions = (filenameOptions: string[] | undefined, outputStructure: OutputStructure | undefined): void => {
    if (filenameOptions) {
        // Check if first argument contains commas - likely a comma-separated list
        if (filenameOptions[0].includes(',')) {
            throw new ArgumentError('--filename-options', 'Filename options should be space-separated, not comma-separated. Example: --filename-options date time subject');
        }

        // Check if first argument looks like a quoted string containing multiple options
        if (filenameOptions.length === 1 && filenameOptions[0].split(' ').length > 1) {
            throw new ArgumentError('--filename-options', 'Filename options should not be quoted. Use: --filename-options date time subject instead of --filename-options "date time subject"');
        }
        const validOptions = ALLOWED_FILENAME_OPTIONS;
        const invalidOptions = filenameOptions.filter(opt => !validOptions.includes(opt as FilenameOption));
        if (invalidOptions.length > 0) {
            throw new ArgumentError('--filename-options', `Invalid filename options: ${invalidOptions.join(', ')}. Valid options are: ${validOptions.join(', ')}`);
        }

        // Validate date option against output structure
        if (filenameOptions.includes('date')) {
            if (outputStructure && outputStructure === 'day') {
                throw new ArgumentError('--filename-options', 'Cannot use date in filename when output structure is "day"');
            }
        }
    }
}

export const validateTimezone = (timezone: string): string => {
    const validOptions = Dates.validTimezones();
    if (validOptions.includes(timezone)) {
        return timezone;
    }
    throw new ArgumentError('--timezone', `Invalid timezone: ${timezone}. Valid options are: ${validOptions.join(', ')}`);
}
