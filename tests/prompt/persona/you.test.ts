import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/logging', () => ({
    getLogger: jest.fn()
}));

let Logging: any;
let You: any;

describe('you', () => {
    let mockLogger: any;
    let mockCustomizeContent: any;

    const mockConfigDir = '/test/config';

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();

        Logging = await import('../../../src/logging');
        You = await import('../../../src/prompt/persona/you');

        // Setup logger mock
        mockLogger = {
            debug: jest.fn()
        };
        (Logging.getLogger as jest.Mock).mockReturnValue(mockLogger);

        // Setup customizeContent mock
        mockCustomizeContent = jest.fn();
    });

    describe('create', () => {
        it('should create you persona with default traits and instructions', async () => {
            const defaultTraits = 'default traits';
            const defaultInstructions = 'default instructions';

            mockCustomizeContent.mockImplementation((configDir: string, file: string, content: string) => {
                if (file.includes('traits')) return defaultTraits;
                if (file.includes('instructions')) return defaultInstructions;
                return content;
            });

            const persona = await You.create(mockConfigDir, { customizeContent: mockCustomizeContent });

            expect(persona).toBeDefined();
            expect(mockCustomizeContent).toHaveBeenCalledTimes(2);
            expect(mockLogger.debug).toHaveBeenCalledTimes(2);
            expect(mockLogger.debug).toHaveBeenCalledWith('Final You traits: %s', defaultTraits);
            expect(mockLogger.debug).toHaveBeenCalledWith('Final You instructions: %s', defaultInstructions);
        });

        it('should handle errors during persona creation', async () => {
            const error = new Error('Customization failed');
            mockCustomizeContent.mockRejectedValue(error);

            await expect(You.create(mockConfigDir, { customizeContent: mockCustomizeContent }))
                .rejects
                .toThrow('Customization failed');
        });
    });
});
