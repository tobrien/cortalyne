import { DEFAULT_AUDIO_EXTENSIONS, DEFAULT_CONTENT_TYPES, DEFAULT_DEBUG, DEFAULT_DIFF, DEFAULT_DRY_RUN, DEFAULT_INPUT_DIRECTORY, DEFAULT_LOG, DEFAULT_MODEL, DEFAULT_OUTPUT_DIRECTORY, DEFAULT_RECURSIVE, DEFAULT_TRANSCRIPTION_MODEL, DEFAULT_VERBOSE } from "./constants";

export interface Config {
    dryRun: boolean;
    verbose: boolean;
    debug: boolean;
    diff: boolean;
    log: boolean;
    model: string;
    transcriptionModel: string;
    contentTypes: string[];
    recursive: boolean;
    inputDirectory: string;
    outputDirectory: string;
    audioExtensions: string[];
}

export const createConfig = (params: {
    dryRun?: boolean;
    verbose?: boolean;
    debug?: boolean;
    diff?: boolean;
    log?: boolean;
    model?: string;
    transcriptionModel?: string;
    contentTypes?: string[];
    recursive?: boolean;
    inputDirectory?: string;
    outputDirectory?: string;
    audioExtensions?: string[];
}): Config => {
    return {
        dryRun: params.dryRun ?? DEFAULT_DRY_RUN,
        verbose: params.verbose ?? DEFAULT_VERBOSE,
        debug: params.debug ?? DEFAULT_DEBUG,
        diff: params.diff ?? DEFAULT_DIFF,
        log: params.log ?? DEFAULT_LOG,
        model: params.model ?? DEFAULT_MODEL,
        transcriptionModel: params.transcriptionModel ?? DEFAULT_TRANSCRIPTION_MODEL,
        contentTypes: params.contentTypes ?? DEFAULT_CONTENT_TYPES,
        recursive: params.recursive ?? DEFAULT_RECURSIVE,
        inputDirectory: params.inputDirectory ?? DEFAULT_INPUT_DIRECTORY,
        outputDirectory: params.outputDirectory ?? DEFAULT_OUTPUT_DIRECTORY,
        audioExtensions: params.audioExtensions ?? DEFAULT_AUDIO_EXTENSIONS,
    }
}