export interface Input {
    dryRun: boolean;
    verbose: boolean;
    debug: boolean;
    transcriptionModel: string;
    model: string;
    openaiApiKey: string;
    contentTypes: string[];
    instructions: string;
}

