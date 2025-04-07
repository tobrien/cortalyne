export interface ClassifiedTranscription {
    text: string;
    type: string;
    subject: string;
}

export interface Instance {
    process(file: string): Promise<void>;
}