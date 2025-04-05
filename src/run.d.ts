import { DEFAULT_AUDIO_EXTENSIONS, DEFAULT_CONTENT_TYPES, DEFAULT_DEBUG, DEFAULT_DIFF, DEFAULT_DRY_RUN, DEFAULT_INPUT_DIRECTORY, DEFAULT_LOG, DEFAULT_MODEL, DEFAULT_OUTPUT_DIRECTORY, DEFAULT_RECURSIVE, DEFAULT_TRANSCRIPTION_MODEL, DEFAULT_VERBOSE } from "./constants";

export type FilenameOption = 'date' | 'time' | 'subject';
export type OutputStructure = 'none' | 'year' | 'month' | 'day';


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
    outputStructure: OutputStructure;
    filenameOptions: FilenameOption[];
}