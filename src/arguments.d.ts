export interface Input {
    dryRun: boolean;
    verbose: boolean;
    debug: boolean;
    transcriptionModel: string;
    model: string;
    openaiApiKey: string;
    recursive: boolean;
    inputDirectory: string;
    outputDirectory: string;
    audioExtensions: string[];
    outputStructure?: string;
    filenameOptions?: string[];

}

