import * as MinorPrompt from '@tobrien/minorprompt';
import * as Chat from '@tobrien/minorprompt/chat';
import * as Formatter from '@tobrien/minorprompt/formatter';
import path from 'path';
import { getLogger } from '../logging';
import * as Storage from '../util/storage';

export const format = (prompt: MinorPrompt.Instance, model: Chat.Model): Chat.Request => {
    const formatter = Formatter.create(model);
    return formatter.format(prompt);
};

export const overrideContent = async (configDir: string, overrideFile: string, overrides: boolean): Promise<{ override?: string, prepend?: string, append?: string }> => {
    const logger = getLogger();
    const storage = Storage.create({ log: logger.debug });

    const baseFile = path.join(configDir, overrideFile);
    const preFile = baseFile.replace('.md', '-pre.md');
    const postFile = baseFile.replace('.md', '-post.md');

    const response: { override?: string, prepend?: string, append?: string } = {};

    if (await storage.exists(preFile)) {
        logger.debug('Found pre file %s', preFile);
        const customTraits = await storage.readFile(preFile, 'utf8');
        response.prepend = customTraits;
    }

    if (await storage.exists(postFile)) {
        logger.debug('Found post file %s', postFile);
        const customTraits = await storage.readFile(postFile, 'utf8');
        response.append = customTraits;
    }

    if (await storage.exists(baseFile)) {
        logger.debug('Found base file %s', baseFile);
        if (overrides) {
            logger.warn('WARNING: Core directives are being overwritten by custom configuration');
            const customTraits = await storage.readFile(baseFile, 'utf8');
            response.override = customTraits;
        } else {
            logger.error('ERROR: Core directives are being overwritten by custom configuration');
            throw new Error('Core directives are being overwritten by custom configuration, but overrides are not enabled.  Please enable --overrides to use this feature.');
        }
    }

    return response;
}

export const customize = async (configDir: string, overrideFile: string, content: string, overrides: boolean): Promise<string> => {
    const logger = getLogger();
    const { override, prepend, append } = await overrideContent(configDir, overrideFile, overrides);
    let finalTraits = content;

    if (override) {
        if (overrides) {
            logger.warn('Override found, replacing content from file %s', override);
            finalTraits = override;
        } else {
            logger.error('ERROR: Core directives are being overwritten by custom configuration');
            throw new Error('Core directives are being overwritten by custom configuration, but overrides are not enabled.  Please enable --overrides to use this feature.');
        }
    }

    if (prepend) {
        logger.debug('Prepend found, adding to content from file %s', prepend);
        finalTraits = prepend + '\n' + finalTraits;
    }

    if (append) {
        logger.debug('Append found, adding to content from file %s', append);
        finalTraits = finalTraits + '\n' + append;
    }

    return finalTraits;
}