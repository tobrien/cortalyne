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
let IdeaType: any;

describe('Idea Type Instructions', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        // Import the mocked modules
        minorPrompt = await import('@tobrien/minorprompt') as unknown as MinorPromptModule;
        constants = await import('../../../../src/constants') as unknown as ConstantsModule;

        // Import the module under test
        IdeaType = await import('../../../../src/prompt/instructions/types/idea');
    });

    it('exports the correct instruction string', () => {
        // Verify the instruction content contains expected key phrases
        expect(IdeaType.INSTRUCTION).toContain('Task #1');
        expect(IdeaType.INSTRUCTION).toContain('Idea');
    });

    it('creates instructions correctly', async () => {
        const configDir = '/test/config';
        const mockCustomizeContent = jest.fn().mockReturnValue(Promise.resolve('customized content'));

        // Call the create function
        const result = await IdeaType.create(configDir, { customizeContent: mockCustomizeContent });

        // Verify customizeContent was called with the correct arguments
        expect(mockCustomizeContent).toHaveBeenCalledWith(
            configDir,
            constants.DEFAULT_TYPE_INSTRUCTIONS_DIR + '/idea.md',
            IdeaType.INSTRUCTION
        );

        // Verify createInstruction was called with the customized content
        expect(minorPrompt.createInstruction).toHaveBeenCalledWith('customized content');

        // Verify the correct result is returned
        expect(result).toEqual(['mocked-instruction']);
    });
}); 