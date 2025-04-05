import { FilenameOption, OutputStructure } from "./output.d";

export interface Config {
    dryRun: boolean;
    verbose: boolean;
    debug: boolean;
    diff: boolean;
    log: boolean;
    model: string;
    timezone: string;
    transcriptionModel: string;
    contentTypes: string[];
    recursive: boolean;
    inputDirectory: string;
    outputDirectory: string;
    audioExtensions: string[];
    outputStructure: OutputStructure;
    filenameOptions: FilenameOption[];
}