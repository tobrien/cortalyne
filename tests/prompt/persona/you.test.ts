import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/logging', () => ({
    getLogger: jest.fn()
}));

let Logging: any;
let You: any;

describe('you', () => {
    let mockLogger: any;
    let mockCustomize: any;

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
        mockCustomize = jest.fn();
    });

    describe('create', () => {
        it('should create you persona with default traits and instructions', async () => {
            const defaultTraits = 'default traits';
            const defaultInstructions = 'default instructions';

            mockCustomize.mockImplementation((configDir: string, file: string, content: string) => {
                if (file.includes('traits')) return defaultTraits;
                if (file.includes('instructions')) return defaultInstructions;
                return content;
            });

            const persona = await You.create(mockConfigDir, true, { customize: mockCustomize });

            expect(persona).toBeDefined();
            expect(mockCustomize).toHaveBeenCalledTimes(2);
            expect(mockLogger.debug).toHaveBeenCalledTimes(2);
            expect(mockLogger.debug).toHaveBeenCalledWith('Final You traits: %s', defaultTraits);
            expect(mockLogger.debug).toHaveBeenCalledWith('Final You instructions: %s', defaultInstructions);
        });

        it('should handle errors during persona creation', async () => {
            const error = new Error('Customization failed');
            mockCustomize.mockRejectedValue(error);

            await expect(You.create(mockConfigDir, true, { customize: mockCustomize }))
                .rejects
                .toThrow('Customization failed');
        });
    });
});
