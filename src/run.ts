import { DEFAULT_AUDIO_EXTENSIONS, DEFAULT_CONFIG_DIR, DEFAULT_CONTENT_TYPES, DEFAULT_DEBUG, DEFAULT_DIFF, DEFAULT_DRY_RUN, DEFAULT_FILENAME_OPTIONS, DEFAULT_INPUT_DIRECTORY, DEFAULT_LOG, DEFAULT_MODEL, DEFAULT_OUTPUT_DIRECTORY, DEFAULT_OUTPUT_STRUCTURE, DEFAULT_OVERRIDES, DEFAULT_RECURSIVE, DEFAULT_TIMEZONE, DEFAULT_TRANSCRIPTION_MODEL, DEFAULT_VERBOSE } from "./constants";

import { Config } from "./run.d";
import { FilenameOption, OutputStructure } from "./output.d";

export const createConfig = (params: {
    dryRun?: boolean;
    verbose?: boolean;
    debug?: boolean;
    diff?: boolean;
    log?: boolean;
    model?: string;
    timezone?: string;
    transcriptionModel?: string;
    contentTypes?: string[];
    recursive?: boolean;
    inputDirectory?: string;
    outputDirectory?: string;
    audioExtensions?: string[];
    outputStructure?: OutputStructure;
    filenameOptions?: FilenameOption[];
    configDir?: string;
    overrides?: boolean;
    classifyModel?: string;
    composeModel?: string;
    contextDirectories?: string[];
}): Config => {
    return {
        dryRun: params.dryRun ?? DEFAULT_DRY_RUN,
        verbose: params.verbose ?? DEFAULT_VERBOSE,
        debug: params.debug ?? DEFAULT_DEBUG,
        diff: params.diff ?? DEFAULT_DIFF,
        log: params.log ?? DEFAULT_LOG,
        model: params.model ?? DEFAULT_MODEL,
        timezone: params.timezone ?? DEFAULT_TIMEZONE,
        transcriptionModel: params.transcriptionModel ?? DEFAULT_TRANSCRIPTION_MODEL,
        contentTypes: params.contentTypes ?? DEFAULT_CONTENT_TYPES,
        recursive: params.recursive ?? DEFAULT_RECURSIVE,
        inputDirectory: params.inputDirectory ?? DEFAULT_INPUT_DIRECTORY,
        outputDirectory: params.outputDirectory ?? DEFAULT_OUTPUT_DIRECTORY,
        audioExtensions: params.audioExtensions ?? DEFAULT_AUDIO_EXTENSIONS,
        outputStructure: params.outputStructure ?? DEFAULT_OUTPUT_STRUCTURE,
        filenameOptions: params.filenameOptions ?? DEFAULT_FILENAME_OPTIONS,
        configDir: params.configDir ?? DEFAULT_CONFIG_DIR,
        overrides: params.overrides ?? DEFAULT_OVERRIDES,
        classifyModel: params.classifyModel ?? DEFAULT_MODEL,
        composeModel: params.composeModel ?? DEFAULT_MODEL,
        contextDirectories: params.contextDirectories,
    }
}