import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/constants', () => ({
    DEFAULT_INSTRUCTIONS_COMPOSE_FILE: 'test-compose.md'
}));

jest.unstable_mockModule('../../../src/prompt/context', () => ({
    loadContextFromDirectories: jest.fn()
}));

jest.unstable_mockModule('../../../src/prompt/instructions/types/call', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../../src/prompt/instructions/types/document', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../../src/prompt/instructions/types/email', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../../src/prompt/instructions/types/idea', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../../src/prompt/instructions/types/meeting', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../../src/prompt/instructions/types/note', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../../src/prompt/instructions/types/other', () => ({
    create: jest.fn()
}));

jest.unstable_mockModule('../../../src/prompt/instructions/types/update', () => ({
    create: jest.fn()
}));

// Move imports here, outside beforeEach
let Constants: any;
let Context: any;
let CallInstructions: any;
let DocumentInstructions: any;
let EmailInstructions: any;
let IdeaInstructions: any;
let MeetingInstructions: any;
let NoteInstructions: any;
let OtherInstructions: any;
let UpdateInstructions: any;
let Compose: any;

describe('compose', () => {
    let mockCustomize: jest.Mock;
    let mockContextSections: any[];

    // Load modules once before any test runs in this describe block
    beforeAll(async () => {
        Constants = await import('../../../src/constants');
        Context = await import('../../../src/prompt/context');
        CallInstructions = await import('../../../src/prompt/instructions/types/call');
        DocumentInstructions = await import('../../../src/prompt/instructions/types/document');
        EmailInstructions = await import('../../../src/prompt/instructions/types/email');
        IdeaInstructions = await import('../../../src/prompt/instructions/types/idea');
        MeetingInstructions = await import('../../../src/prompt/instructions/types/meeting');
        NoteInstructions = await import('../../../src/prompt/instructions/types/note');
        OtherInstructions = await import('../../../src/prompt/instructions/types/other');
        UpdateInstructions = await import('../../../src/prompt/instructions/types/update');
        Compose = await import('../../../src/prompt/instructions/compose');
    });

    beforeEach(async () => {
        // Reset mocks only
        jest.clearAllMocks();

        // Setup customizeContent mock
        // @ts-ignore
        mockCustomize = jest.fn().mockResolvedValue('customized instructions');

        // Setup context sections mock
        mockContextSections = [
            { type: 'section', content: 'context section 1' },
            { type: 'section', content: 'context section 2' }
        ];
        // @ts-ignore
        (Context.loadContextFromDirectories as jest.Mock).mockResolvedValue(mockContextSections);
        // Re-apply mocks if necessary (sometimes needed depending on test structure)
        // @ts-ignore
        (NoteInstructions.create as jest.Mock).mockResolvedValue([]); // Reset to default or specific value if needed per test
    });

    describe('create', () => {
        it('should create instructions with default process instructions and type-specific instructions', async () => {
            const type = 'note';
            const configDir = '/test/config';
            const contextDirectories = ['/test/context'];

            // Setup note instructions mock
            const mockNoteInstructions = [
                { type: 'instruction', content: 'note instruction 1' },
                { type: 'instruction', content: 'note instruction 2' }
            ];
            // @ts-ignore
            (NoteInstructions.create as jest.Mock).mockResolvedValue(mockNoteInstructions);

            const result = await Compose.create(type, configDir, true, { customize: mockCustomize }, contextDirectories);

            // Verify customizeContent was called with correct arguments
            expect(mockCustomize).toHaveBeenCalledWith(
                configDir,
                Constants.DEFAULT_INSTRUCTIONS_COMPOSE_FILE,
                expect.any(String),
                true
            );

            // Verify note instructions were created
            expect(NoteInstructions.create).toHaveBeenCalledWith(configDir, true, { customize: mockCustomize });

            // Verify context was loaded
            expect(Context.loadContextFromDirectories).toHaveBeenCalledWith(contextDirectories);

            // Verify result contains all expected instructions
            expect(result).toHaveLength(5); // note instructions + process instruction + context sections
            expect(result[0]).toEqual(mockNoteInstructions[0]);
            expect(result[1]).toEqual(mockNoteInstructions[1]);
            expect(result[2]).toEqual(expect.objectContaining({ text: 'customized instructions' }));
            expect(result[3]).toEqual(mockContextSections[0]);
            expect(result[4]).toEqual(mockContextSections[1]);
        });

        it('should handle unknown note types gracefully', async () => {
            const type = 'unknown';
            const configDir = '/test/config';

            const result = await Compose.create(type, configDir, true, { customize: mockCustomize });

            // Verify customizeContent was called
            expect(mockCustomize).toHaveBeenCalled();

            // Verify no type-specific instructions were created
            expect(result).toHaveLength(1); // only process instruction
            expect(result[0]).toEqual(expect.objectContaining({ text: 'customized instructions' }));
        });

        it('should work without context directories', async () => {
            const type = 'note';
            const configDir = '/test/config';

            // Setup note instructions mock
            const mockNoteInstructions = [
                { type: 'instruction', content: 'note instruction' }
            ];
            // @ts-ignore
            (NoteInstructions.create as jest.Mock).mockResolvedValue(mockNoteInstructions);

            const result = await Compose.create(type, configDir, true, { customize: mockCustomize });

            // Verify context was not loaded
            expect(Context.loadContextFromDirectories).not.toHaveBeenCalled();

            // Verify result contains only note and process instructions
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(mockNoteInstructions[0]);
            expect(result[1]).toEqual(expect.objectContaining({ text: 'customized instructions' }));
        });
    });
});
