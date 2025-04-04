export interface Instance {
    process(file: string): Promise<void>;
}