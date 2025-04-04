#!/usr/bin/env node
import { Logger } from 'winston';
import * as Run from './run';
import { run } from './util/child';
import { createCompletion } from './util/openai';
export class ExitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ExitError';
    }
}

export async function gatherLog(runConfig: Run.Config, logger: Logger): Promise<string> {
    try {
        logger.verbose('Gathering change information from Git');

        try {
            logger.debug('Executing git log');
            const { stdout, stderr } = await run('git log');
            if (stderr) {
                logger.warn('Git log produced stderr: %s', stderr);
            }
            logger.debug('Git log output: %s', stdout);
            return stdout;
        } catch (error: any) {
            logger.error('Failed to execute git log: %s', error.message);
            throw error;
        }
    } catch (error: any) {
        logger.error('Error occurred during gather change phase: %s %s', error.message, error.stack);
        throw new ExitError('Error occurred during gather change phase');
    }
}

export async function gatherDiff(runConfig: Run.Config, logger: Logger): Promise<string> {
    try {
        logger.verbose('Gathering change information from Git');

        try {
            logger.debug('Executing git diff');
            const { stdout, stderr } = await run('git diff -- . \': (exclude)dist\' \': (exclude)node_modules\' \': (exclude).env\'');
            if (stderr) {
                logger.warn('Git log produced stderr: %s', stderr);
            }
            logger.debug('Git log output: %s', stdout);
            return stdout;
        } catch (error: any) {
            logger.error('Failed to execute git log: %s', error.message);
            throw error;
        }
    } catch (error: any) {
        logger.error('Error occurred during gather change phase: %s %s', error.message, error.stack);
        throw new ExitError('Error occurred during gather change phase');
    }
}

export async function createSummary(instructions: string, content: string, runConfig: Run.Config, logger: Logger): Promise<string> {
    try {
        logger.verbose('Creating summary');

        const prompt = `
        <instructions>
        ${instructions}
        </instructions>
        ${content}
        `

        logger.debug('Sending Prompt: %s', prompt);
        const summary = await createCompletion(prompt, logger);
        return summary;
    } catch (error: any) {
        logger.error('Error occurred during create summary phase: %s %s', error.message, error.stack);
        throw new ExitError('Error occurred during create summary phase');
    }
}