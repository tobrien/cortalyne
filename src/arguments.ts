import { Command } from "commander";
import { getLogger } from "./logging";
import { Input } from "./arguments.d";
import { ALLOWED_CONTENT_TYPES, DEFAULT_CHARACTER_ENCODING, DEFAULT_CONTENT_TYPES, DEFAULT_DEBUG, DEFAULT_DIFF, DEFAULT_DRY_RUN, DEFAULT_INSTRUCTIONS, DEFAULT_INSTRUCTIONS_FILE, DEFAULT_LOG, DEFAULT_MODEL, DEFAULT_TRANSCRIPTION_MODEL, DEFAULT_VERBOSE, PROGRAM_NAME, VERSION } from "./constants";
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
        .option('--openai-api-key', 'OpenAI API key', process.env.OPENAI_API_KEY)
        .option('--transcription-model <transcriptionModel>', 'OpenAI transcription model to use', DEFAULT_TRANSCRIPTION_MODEL)
        .option('--model <model>', 'OpenAI model to use', DEFAULT_MODEL)
        .option('-c, --content-types [contentTypes...]', 'content types to include in the summary', DEFAULT_CONTENT_TYPES)
        .option('-i, --instructions', 'instructions for the AI', DEFAULT_INSTRUCTIONS_FILE)
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
    diff: boolean;
    log: boolean;
    model: string;
    transcriptionModel: string;
    instructions: string;
}> {
    if (!options.openaiApiKey) {
        throw new Error('OpenAI API key is required, set OPENAI_API_KEY environment variable');
    }

    const { diff, log } = options.contentTypes ? validateContentTypes(options.contentTypes) : { diff: DEFAULT_DIFF, log: DEFAULT_LOG };

    const instructions: string | null = options.instructions ? await validateInstructions(options.instructions) : null;

    return {
        dryRun: options.dryRun,
        verbose: options.verbose,
        debug: options.debug,
        diff,
        log,
        model: options.model,
        transcriptionModel: options.transcriptionModel ?? DEFAULT_TRANSCRIPTION_MODEL,
        instructions: instructions ?? DEFAULT_INSTRUCTIONS,
    };
}

function validateContentTypes(contentTypes: string[]) {
    if (contentTypes.some(contentType => !ALLOWED_CONTENT_TYPES.includes(contentType))) {
        throw new Error(`Invalid content type: ${contentTypes.join(', ')}, allowed content types: ${ALLOWED_CONTENT_TYPES.join(', ')}`);
    }

    const diff = contentTypes.includes('diff');
    const log = contentTypes.includes('log');

    return {
        diff,
        log,
    };
}

async function validateInstructions(instructions: string): Promise<string | null> {
    const logger = getLogger();
    const storage = Storage.create({ log: logger.info });
    try {
        if (await storage.isFileReadable(instructions)) {
            return storage.readFile(instructions, DEFAULT_CHARACTER_ENCODING);
        }
    } catch (error: any) {
        logger.error('Error reading instructions file: %s', error.message);
    }
    return null;
}