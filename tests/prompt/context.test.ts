import { jest } from '@jest/globals';

// Define the interface for better typing
interface MockSection {
    add: jest.Mock;
    title: string;
}

jest.unstable_mockModule('../../src/logging', () => ({
    getLogger: jest.fn()
}));

jest.unstable_mockModule('../../src/util/storage', () => ({
    create: jest.fn()
}));

// Mock the minorprompt package
jest.unstable_mockModule('@tobrien/minorprompt', () => ({
    createSection: jest.fn(() => ({
        add: jest.fn(),
        title: ''
    }))
}));

let Logging: any;
let Storage: any;
let Context: any;
let MinorPrompt: any;

describe('context', () => {
    let mockLogger: any;
    let mockStorage: any;
    let mockSection: MockSection;

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();

        Logging = await import('../../src/logging');
        Storage = await import('../../src/util/storage');
        Context = await import('../../src/prompt/context');
        MinorPrompt = await import('@tobrien/minorprompt');

        // Setup logger mock
        mockLogger = {
            debug: jest.fn(),
            error: jest.fn()
        };
        (Logging.getLogger as jest.Mock).mockReturnValue(mockLogger);

        // Setup storage mock
        mockStorage = {
            exists: jest.fn(),
            readFile: jest.fn(),
            listFiles: jest.fn(),
            isFile: jest.fn()
        };
        (Storage.create as jest.Mock).mockReturnValue(mockStorage);

        // Setup section mock
        mockSection = {
            add: jest.fn(),
            title: ''
        };

        // Use any for the title parameter to avoid TypeScript errors with jest mock
        (MinorPrompt.createSection as jest.Mock).mockImplementation((title: any) => {
            return {
                add: jest.fn(),
                title: title || ''
            };
        });
    });

    describe('extractFirstHeader', () => {
        it('should extract the first header from markdown text', () => {
            const markdown = '# Test Header\nSome content';
            const result = Context.extractFirstHeader(markdown);
            expect(result).toBe('Test Header');
        });

        it('should return null if no header is found', () => {
            const markdown = 'No header here';
            const result = Context.extractFirstHeader(markdown);
            expect(result).toBeNull();
        });
    });

    describe('removeFirstHeader', () => {
        it('should remove the first header from markdown text', () => {
            const markdown = '# Test Header\nSome content';
            const result = Context.removeFirstHeader(markdown);
            expect(result).toBe('Some content');
        });

        it('should return original text if no header is found', () => {
            const markdown = 'No header here';
            const result = Context.removeFirstHeader(markdown);
            expect(result).toBe(markdown);
        });
    });

    describe('loadContextFromDirectories', () => {
        it('should return empty array when no directories provided', async () => {
            const result = await Context.loadContextFromDirectories();
            expect(result).toEqual([]);
        });

        it('should load context from directories with context.md', async () => {
            const contextDirectories = ['/test/context'];
            const contextContent = '# Main Context\nContext content';
            const fileContent = '# File Section\nFile content';

            // Setup storage mocks
            mockStorage.exists.mockResolvedValue(true);
            mockStorage.readFile.mockImplementation((path: string) => {
                if (path.endsWith('context.md')) {
                    return contextContent;
                }
                return fileContent;
            });
            mockStorage.listFiles.mockResolvedValue(['file1.md']);
            mockStorage.isFile.mockResolvedValue(true);

            const result = await Context.loadContextFromDirectories(contextDirectories);

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Main Context');

            // Verify the main section's add method was called with context content
            expect(result[0].add).toHaveBeenCalledWith('Context content');

            // Verify a subsection was created and added to the main section
            expect(MinorPrompt.createSection).toHaveBeenCalledWith('File Section');

            // The second result will be the file section that was created
            const mockCreateSection = MinorPrompt.createSection as jest.Mock;
            const fileSectionCallIndex = mockCreateSection.mock.calls.findIndex(
                call => call[0] === 'File Section'
            );

            // Get the mock result for the file section
            const fileSection = mockCreateSection.mock.results[fileSectionCallIndex].value;

            // Verify file section was created correctly
            expect((fileSection as any).title).toBe('File Section');
            expect((fileSection as any).add).toHaveBeenCalledWith('File content');

            // Verify file section was added to main section
            const mainSection = result[0];
            expect(mainSection.add).toHaveBeenCalledWith(expect.objectContaining({
                title: 'File Section'
            }));
        });

        it('should handle directories without context.md', async () => {
            const contextDirectories = ['/test/context'];
            const fileContent = '# File Section\nFile content';

            // Setup storage mocks
            mockStorage.exists.mockResolvedValue(false);
            mockStorage.readFile.mockResolvedValue(fileContent);
            mockStorage.listFiles.mockResolvedValue(['file1.md']);
            mockStorage.isFile.mockResolvedValue(true);

            const result = await Context.loadContextFromDirectories(contextDirectories);

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('context');

            // Verify a subsection was created
            expect(MinorPrompt.createSection).toHaveBeenCalledWith('File Section');

            // The file section is created with the specified title
            const mockCreateSection = MinorPrompt.createSection as jest.Mock;
            const fileSectionCallIndex = mockCreateSection.mock.calls.findIndex(
                call => call[0] === 'File Section'
            );

            // Get the mock result for the file section
            const fileSection = mockCreateSection.mock.results[fileSectionCallIndex].value;

            // Verify file section was created correctly
            expect((fileSection as any).title).toBe('File Section');
            expect((fileSection as any).add).toHaveBeenCalledWith('File content');

            // Verify file section was added to main section
            const mainSection = result[0];
            expect(mainSection.add).toHaveBeenCalledWith(expect.objectContaining({
                title: 'File Section'
            }));
        });

        it('should handle errors when processing directories', async () => {
            const contextDirectories = ['/test/context'];
            const error = new Error('Test error');

            // Setup storage mock to throw error
            mockStorage.exists.mockRejectedValue(error);

            const result = await Context.loadContextFromDirectories(contextDirectories);

            expect(result).toEqual([]);
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error processing context directory /test/context: Error: Test error'
            );
        });
    });
});
