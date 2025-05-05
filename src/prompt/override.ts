import { Formatter, Prompt, Model, Request, Section, Weighted, Parser } from '@tobrien/minorprompt';
import path from 'path';
import { getLogger } from '../logging';
import * as Storage from '../util/storage';


export const format = (prompt: Prompt, model: Model): Request => {
    return Formatter.formatPrompt(model, prompt);
};

export const overrideContent = async <T extends Weighted>(
    configDir: string,
    overrideFile: string,
    section: Section<T>,
    overrides: boolean,
): Promise<{ override?: Section<T>, prepend?: Section<T>, append?: Section<T> }> => {

    const logger = getLogger();
    const storage = Storage.create({ log: logger.debug });

    const baseFile = path.join(configDir, overrideFile);
    const preFile = baseFile.replace('.md', '-pre.md');
    const postFile = baseFile.replace('.md', '-post.md');

    const response: { override?: Section<T>, prepend?: Section<T>, append?: Section<T> } = {};

    if (await storage.exists(preFile)) {
        logger.debug('Found pre file %s', preFile);
        response.prepend = await Parser.parseFile<T>(preFile);
    }

    if (await storage.exists(postFile)) {
        logger.debug('Found post file %s', postFile);
        response.append = await Parser.parseFile<T>(postFile);
    }

    if (await storage.exists(baseFile)) {
        logger.debug('Found base file %s', baseFile);
        if (overrides) {
            logger.warn('WARNING: Core directives are being overwritten by custom configuration');
            response.override = await Parser.parseFile<T>(baseFile);
        } else {
            logger.error('ERROR: Core directives are being overwritten by custom configuration');
            throw new Error('Core directives are being overwritten by custom configuration, but overrides are not enabled.  Please enable --overrides to use this feature.');
        }
    }

    return response;
}

export const customize = async <T extends Weighted>(configDir: string, overrideFile: string, section: Section<T>, overrides: boolean): Promise<Section<T>> => {
    const logger = getLogger();
    const { override, prepend, append }: { override?: Section<T>, prepend?: Section<T>, append?: Section<T> } = await overrideContent(configDir, overrideFile, section, overrides);
    let finalSection: Section<T> = section;

    if (override) {
        if (overrides) {
            logger.warn('Override found, replacing content from file %s', override);
            finalSection = override;
        } else {
            logger.error('ERROR: Core directives are being overwritten by custom configuration');
            throw new Error('Core directives are being overwritten by custom configuration, but overrides are not enabled.  Please enable --overrides to use this feature.');
        }
    }

    if (prepend) {
        logger.debug('Prepend found, adding to content from file %s', prepend);
        finalSection = finalSection.prepend(prepend);
    }

    if (append) {
        logger.debug('Append found, adding to content from file %s', append);
        finalSection = finalSection.append(append);
    }

    logger.debug('Final section:\n\n%s\n\n', Formatter.formatSection(finalSection));

    return finalSection;
}