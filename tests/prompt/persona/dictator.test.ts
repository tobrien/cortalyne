import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/logging', () => ({
    getLogger: jest.fn()
}));

let Logging: any;
let Dictator: any;

describe('dictator', () => {
    let mockLogger: any;
    let mockCustomizeContent: any;

    const mockConfigDir = '/test/config';

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();

        Logging = await import('../../../src/logging');
        Dictator = await import('../../../src/prompt/persona/dictator');

        // Setup logger mock
        mockLogger = {
            debug: jest.fn()
        };
        (Logging.getLogger as jest.Mock).mockReturnValue(mockLogger);

        // Setup customizeContent mock
        mockCustomizeContent = jest.fn();
    });

    describe('create', () => {
        it('should create dictator persona with default traits and instructions', async () => {
            const defaultTraits = 'default traits';
            const defaultInstructions = 'default instructions';

            mockCustomizeContent.mockImplementation((configDir: string, file: string, content: string) => {
                if (file.includes('traits')) return defaultTraits;
                if (file.includes('instructions')) return defaultInstructions;
                return content;
            });

            const persona = await Dictator.create(mockConfigDir, { customizeContent: mockCustomizeContent });

            expect(persona).toBeDefined();
            expect(mockCustomizeContent).toHaveBeenCalledTimes(2);
            expect(mockLogger.debug).toHaveBeenCalledTimes(2);
            expect(mockLogger.debug).toHaveBeenCalledWith('Final Dictator traits: %s', defaultTraits);
            expect(mockLogger.debug).toHaveBeenCalledWith('Final Dictator instructions: %s', defaultInstructions);
        });

        it('should handle errors during persona creation', async () => {
            const error = new Error('Customization failed');
            mockCustomizeContent.mockRejectedValue(error);

            await expect(Dictator.create(mockConfigDir, { customizeContent: mockCustomizeContent }))
                .rejects
                .toThrow('Customization failed');
        });
    });
});
