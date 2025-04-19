import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/constants', () => ({
    DEFAULT_INSTRUCTIONS_CLASSIFY_FILE: 'test-classify.md'
}));

let ClassifyInstructions: any;

describe('classify instructions', () => {
    let mockOverrideContent: any;

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();

        ClassifyInstructions = await import('../../../src/prompt/instructions/classify');

        // Setup mock for generateOverrideContent
        mockOverrideContent = jest.fn();
    });

    describe('create', () => {
        it('should create instructions with override content', async () => {
            const configDir = '/test/config';
            const overrideContent = {
                override: 'override instructions'
            };

            mockOverrideContent.mockResolvedValue(overrideContent);

            const result = await ClassifyInstructions.create(configDir, true, {
                overrideContent: mockOverrideContent
            });

            expect(mockOverrideContent).toHaveBeenCalledWith(
                configDir,
                'test-classify.md',
                true
            );
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(expect.objectContaining({
                text: expect.any(String)
            }));
        });

        it('should create instructions with prepend and append content', async () => {
            const configDir = '/test/config';
            const overrideContent = {
                prepend: 'prepend instructions',
                append: 'append instructions'
            };

            mockOverrideContent.mockResolvedValue(overrideContent);

            const result = await ClassifyInstructions.create(configDir, true, {
                overrideContent: mockOverrideContent
            });

            expect(result).toHaveLength(10); // 7 default sections + prepend + append
            expect(result[0]).toEqual(expect.objectContaining({
                text: 'prepend instructions'
            }));
            expect(result[9]).toEqual(expect.objectContaining({
                text: 'append instructions'
            }));
        });

        it('should create default instructions when no override content is provided', async () => {
            const configDir = '/test/config';
            const overrideContent = {};

            mockOverrideContent.mockResolvedValue(overrideContent);

            const result = await ClassifyInstructions.create(configDir, true, {
                overrideContent: mockOverrideContent
            });

            expect(result).toHaveLength(8); // 7 default sections
            expect(result[0]).toEqual(expect.objectContaining({
                text: expect.stringContaining('Task #1 - Analyze the transcript')
            }));
        });
    });
});
