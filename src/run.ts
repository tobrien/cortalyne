import { DEFAULT_DEBUG, DEFAULT_DIFF, DEFAULT_DRY_RUN, DEFAULT_INSTRUCTIONS, DEFAULT_LOG, DEFAULT_MODEL, DEFAULT_VERBOSE } from "./constants";

export interface Config {
    dryRun: boolean;
    verbose: boolean;
    debug: boolean;
    diff: boolean;
    log: boolean;
    instructions: string;
    model: string;
}

export const createConfig = (params: {
    dryRun?: boolean;
    verbose?: boolean;
    debug?: boolean;
    diff?: boolean;
    log?: boolean;
    instructions?: string;
    model?: string;
}): Config => {
    return {
        dryRun: params.dryRun ?? DEFAULT_DRY_RUN,
        verbose: params.verbose ?? DEFAULT_VERBOSE,
        debug: params.debug ?? DEFAULT_DEBUG,
        diff: params.diff ?? DEFAULT_DIFF,
        log: params.log ?? DEFAULT_LOG,
        instructions: params.instructions ?? DEFAULT_INSTRUCTIONS,
        model: params.model ?? DEFAULT_MODEL,
    }
}