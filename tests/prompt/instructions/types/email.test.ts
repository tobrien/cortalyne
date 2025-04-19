import { jest } from '@jest/globals';

jest.unstable_mockModule('@tobrien/minorprompt', () => ({
    createInstruction: jest.fn().mockReturnValue('mocked-instruction'),
    Instruction: jest.fn(),
    Section: jest.fn()
}));

jest.unstable_mockModule('../../../../src/constants', () => ({
    DEFAULT_TYPE_INSTRUCTIONS_DIR: '/test/instructions/types'
}));

// Define types for our mocks
interface MinorPromptModule {
    createInstruction: jest.Mock;
    Instruction: jest.Mock;
    Section: jest.Mock;
}

interface ConstantsModule {
    DEFAULT_TYPE_INSTRUCTIONS_DIR: string;
}

let minorPrompt: MinorPromptModule;
let constants: ConstantsModule;
let EmailType: any;

describe('Email Type Instructions', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        // Import the mocked modules
        minorPrompt = await import('@tobrien/minorprompt') as unknown as MinorPromptModule;
        constants = await import('../../../../src/constants') as unknown as ConstantsModule;

        // Import the module under test
        EmailType = await import('../../../../src/prompt/instructions/types/email');
    });

    it('exports the correct instruction string', () => {
        // Verify the instruction content contains expected key phrases
        expect(EmailType.INSTRUCTION).toContain('Task #1');
        expect(EmailType.INSTRUCTION).toContain('Email');
    });

    it('creates instructions correctly', async () => {
        const configDir = '/test/config';
        const mockCustomize = jest.fn().mockReturnValue(Promise.resolve('customized content'));

        // Call the create function
        const result = await EmailType.create(configDir, true, { customize: mockCustomize });

        // Verify customize was called with the correct arguments
        expect(mockCustomize).toHaveBeenCalledWith(
            configDir,
            constants.DEFAULT_TYPE_INSTRUCTIONS_DIR + '/email.md',
            expect.any(String),
            true
        );

        // Verify createInstruction was called with the customized content
        expect(minorPrompt.createInstruction).toHaveBeenCalledWith('customized content');

        // Verify the correct result is returned
        expect(result).toEqual(['mocked-instruction']);
    });
}); 