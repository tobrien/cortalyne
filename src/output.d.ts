export type FilenameOption = 'date' | 'time' | 'subject';
export type OutputStructure = 'none' | 'year' | 'month' | 'day';

export interface Output {
    constructOutputDirectory: (creation: Date, baseDirectory: string) => string;
    constructFilename: (creation: Date, type: string, hash: string, options?: { subject?: string }) => string;
}