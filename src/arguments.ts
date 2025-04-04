import { Command } from "commander";
import { Input } from "./arguments.d";
import { ALLOWED_AUDIO_EXTENSIONS, DEFAULT_AUDIO_EXTENSIONS, DEFAULT_DEBUG, DEFAULT_DRY_RUN, DEFAULT_INPUT_DIRECTORY, DEFAULT_MODEL, DEFAULT_OUTPUT_DIRECTORY, DEFAULT_RECURSIVE, DEFAULT_TRANSCRIPTION_MODEL, DEFAULT_VERBOSE, PROGRAM_NAME, VERSION } from "./constants";
import { getLogger } from "./logging";
import * as Run from "./run";
import * as Storage from "./util/storage";

export const configure = async (): Promise<[Run.Config]> => {
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
        .option('-d, --input-directory <inputDirectory>', 'input directory', DEFAULT_INPUT_DIRECTORY)
        .option('-a, --audio-extensions [audioExtensions...]', 'audio extensions to include in the summary', DEFAULT_AUDIO_EXTENSIONS)
        .version(VERSION);

    program.parse();

    const options: Input = program.opts<Input>();

    const params = await validateOptions(options);

    // Create the run configuration
    const runConfig: Run.Config = Run.createConfig(params);

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