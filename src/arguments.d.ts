export interface Input {
    dryRun: boolean;
    verbose: boolean;
    debug: boolean;
    transcriptionModel: string;
    model: string;
    openaiApiKey: string;
    recursive: boolean;
    timezone: string;
    inputDirectory: string;
    outputDirectory: string;
    audioExtensions: string[];
    outputStructure?: string;
    filenameOptions?: string[];
    configDir: string;
    overrides: boolean;
    classifyModel?: string;
    composeModel?: string;
    contextDirectories?: string[];
}

