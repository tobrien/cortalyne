#!/usr/bin/env node
import 'dotenv/config';
import * as Arguments from './arguments';
import { getLogger, setLogLevel } from './logging';
import { createSummary, ExitError, gatherDiff, gatherLog } from './phases';
import * as Run from './run';

export async function main() {


    const [runConfig]: [Run.Config] = await Arguments.configure();

    // Set log level based on verbose flag
    if (runConfig.verbose) {
        setLogLevel('verbose');
    }
    if (runConfig.debug) {
        setLogLevel('debug');
    }

    const logger = getLogger();

    try {

        let content = '';

        if (runConfig.log) {
            const log = await gatherLog(runConfig, logger);
            content += `<log>\n${log}\n</log>`;
        }

        if (runConfig.diff) {
            const diff = await gatherDiff(runConfig, logger);
            content += `<diff>\n${diff}\n</diff>`;
        }

        const summary = await createSummary(runConfig.instructions, content, runConfig, logger);

        // eslint-disable-next-line no-console
        console.log(summary);
    } catch (error: any) {
        if (error instanceof ExitError) {
            logger.error('Exiting due to Error');
        } else {
            logger.error('Exiting due to Error: %s', error.message);
        }
        process.exit(1);
    }
}

main();