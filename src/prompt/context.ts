import { Instruction, Section, createSection } from "@tobrien/minorprompt";
import * as Storage from "../util/storage";
import { getLogger } from "../logging";
import path from "path";

/**
 * Extracts the first header from Markdown text
 * @param markdownText The Markdown text to parse
 * @returns The first header found in the Markdown or null if none is found
 */
export function extractFirstHeader(markdownText: string): string | null {
    // Regular expression to match Markdown headers (# Header, ## Header, etc.)
    const headerRegex = /^(#{1,6})\s+(.+?)(?:\n|$)/m;
    const match = markdownText.match(headerRegex);

    if (match && match[2]) {
        return match[2].trim();
    }

    return null;
}

/**
 * Removes the first header from Markdown text
 * @param markdownText The Markdown text to process
 * @returns The Markdown text without the first header
 */
export function removeFirstHeader(markdownText: string): string {
    // Regular expression to match Markdown headers (# Header, ## Header, etc.)
    const headerRegex = /^(#{1,6})\s+(.+?)(?:\n|$)/m;
    const match = markdownText.match(headerRegex);

    if (match) {
        return markdownText.replace(headerRegex, '').trim();
    }

    return markdownText;
}

/**
 * Loads context from the provided directories and returns instruction sections
 * @param contextDirectories Directories containing context files
 * @returns Array of instruction sections loaded from context directories
 */
export async function loadContextFromDirectories(
    contextDirectories?: string[]
): Promise<Section<Instruction>[]> {
    const contextSections: Section<Instruction>[] = [];

    if (!contextDirectories || contextDirectories.length === 0) {
        return contextSections;
    }

    const logger = getLogger();
    const storage = Storage.create({ log: logger.debug });

    // Add context sections from each directory
    for (const contextDir of contextDirectories) {
        try {
            const dirName = path.basename(contextDir);
            let mainContextSection: Section<Instruction>;

            // First check if there's a context.md file
            const contextFile = path.join(contextDir, 'context.md');

            if (await storage.exists(contextFile)) {
                const mainContextContent = await storage.readFile(contextFile, 'utf8');
                // Extract the first header from the Markdown content
                const firstHeader = extractFirstHeader(mainContextContent);

                // Use the header from context.md as the section title, or fallback to directory name
                const sectionTitle = firstHeader || dirName;
                mainContextSection = createSection<Instruction>(sectionTitle);

                // Add content without the header
                if (firstHeader) {
                    mainContextSection.add(removeFirstHeader(mainContextContent));
                } else {
                    mainContextSection.add(mainContextContent);
                }
            } else {
                // If no context.md exists, use directory name as title
                mainContextSection = createSection<Instruction>(dirName);
            }

            // Get all other files in the directory
            const files = await storage.listFiles(contextDir);
            for (const file of files) {
                // Skip the context.md file as it's already processed
                if (file === 'context.md') continue;

                const filePath = path.join(contextDir, file);
                if (await storage.isFile(filePath)) {
                    const fileContent = await storage.readFile(filePath, 'utf8');
                    let sectionName = file;
                    let contentToAdd = fileContent;

                    // Extract header if it exists
                    if (file.endsWith('.md')) {
                        const fileHeader = extractFirstHeader(fileContent);
                        if (fileHeader) {
                            sectionName = fileHeader;
                            // Remove the header from the content
                            contentToAdd = removeFirstHeader(fileContent);
                        }
                    }

                    // Create a subsection with the extracted name
                    const fileSection = createSection<Instruction>(sectionName);
                    fileSection.add(contentToAdd);

                    // Add this file section to the main context section
                    mainContextSection.add(fileSection as unknown as Instruction);
                }
            }

            contextSections.push(mainContextSection);
        } catch (error) {
            logger.error(`Error processing context directory ${contextDir}: ${error}`);
        }
    }

    return contextSections;
} 