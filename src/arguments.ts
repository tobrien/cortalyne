import { Command } from "commander";
import { Input } from "./arguments.d";
import { ALLOWED_AUDIO_EXTENSIONS, ALLOWED_FILENAME_OPTIONS, ALLOWED_OUTPUT_STRUCTURES, DEFAULT_AUDIO_EXTENSIONS, DEFAULT_DEBUG, DEFAULT_DRY_RUN, DEFAULT_INPUT_DIRECTORY, DEFAULT_MODEL, DEFAULT_OUTPUT_DIRECTORY, DEFAULT_RECURSIVE, DEFAULT_TRANSCRIPTION_MODEL, DEFAULT_VERBOSE, PROGRAM_NAME, VERSION } from "./constants";
import { getLogger } from "./logging";
import * as Run from "./run";
import * as Storage from "./util/storage";
import { ArgumentError } from "./error/ArgumentError";
import { OutputStructure, FilenameOption } from "./run.d";
import { Config as RunConfig } from "./run.d";

export const configure = async (): Promise<[RunConfig]> => {
    const program = new Command();

    program
        .name(PROGRAM_NAME)
        .summary('Create Intelligent Release Notes or Change Logs from Git')
        .description('Create Intelligent Release Notes or Change Logs from Git')
        .option('--dry-run', 'perform a dry run without saving files', DEFAULT_DRY_RUN)
        .option('--verbose', 'enable verbose logging', DEFAULT_VERBOSE)
        .option('--debug', 'enable debug logging', DEFAULT_DEBUG)
        .option('--openai-api-key <openaiApiKey>', 'OpenAI API key', process.env.OPENAI_API_KEY)
        .option('--transcription-model <transcriptionModel>', 'OpenAI transcription model to use', DEFAULT_TRANSCRIPTION_MODEL)
        .option('--model <model>', 'OpenAI model to use', DEFAULT_MODEL)
        .option('-r, --recursive', 'recursive mode, process all files in the input directory', DEFAULT_RECURSIVE)
        .option('-o, --output-directory <outputDirectory>', 'output directory', DEFAULT_OUTPUT_DIRECTORY)
        .option('-i, --input-directory <inputDirectory>', 'input directory', DEFAULT_INPUT_DIRECTORY)
        .option('-a, --audio-extensions [audioExtensions...]', 'audio extensions to include in the summary', DEFAULT_AUDIO_EXTENSIONS)
        .option('--output-structure <type>', 'output directory structure (none/year/month/day)')
        .option('--filename-options [filenameOptions...]', 'filename format options (space-separated list of: date,time,subject) example \'date subject\'', ['date', 'time', 'subject'])
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
    inputDirectory: string;
    outputDirectory: string;
    audioExtensions: string[];
}> {
    if (!options.openaiApiKey) {
        throw new Error('OpenAI API key is required, set OPENAI_API_KEY environment variable');
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


    return {
        dryRun: options.dryRun,
        verbose: options.verbose,
        debug: options.debug,
        model: options.model,
        transcriptionModel: options.transcriptionModel ?? DEFAULT_TRANSCRIPTION_MODEL,
        recursive: options.recursive ?? DEFAULT_RECURSIVE,
        inputDirectory: options.inputDirectory ?? DEFAULT_INPUT_DIRECTORY,
        outputDirectory: options.outputDirectory ?? DEFAULT_OUTPUT_DIRECTORY,
        audioExtensions: options.audioExtensions ?? DEFAULT_AUDIO_EXTENSIONS,
    };
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
