import { Instruction, Section, createInstruction } from "@tobrien/minorprompt";
import { DEFAULT_INSTRUCTIONS_COMPOSE_FILE } from "../../constants";
import * as CallInstructions from "./types/call";
import * as DocumentInstructions from "./types/document";
import * as EmailInstructions from "./types/email";
import * as IdeaInstructions from "./types/idea";
import * as MeetingInstructions from "./types/meeting";
import * as NoteInstructions from "./types/note";
import * as OtherInstructions from "./types/other";
import * as UpdateInstructions from "./types/update";

const INSTRUCTIONS_PROCESS = `
Capture and organize the information from the transcript into a more structured format as defined by the note type.

Produce an organized and formatted not in a Markdown format that is roughly the same length as the original transcript.

Consult the specific instructions for this note type that are included for further guidance.

The content area of this message contains the row transcript of an audio now, and the context contains information from a prior step that gather information about the note type, note subject, the people, projects, and places involved in this note.
`;

const INSTRUCTIONS_FACTORIES: Record<string, (configDir: string, { customizeContent }: { customizeContent: (configDir: string, overrideFile: string, content: string) => Promise<string> }) => Promise<(Instruction | Section<Instruction>)[]>> = {
    call: CallInstructions.create,
    email: EmailInstructions.create,
    idea: IdeaInstructions.create,
    meeting: MeetingInstructions.create,
    note: NoteInstructions.create,
    other: OtherInstructions.create,
    document: DocumentInstructions.create,
    update: UpdateInstructions.create,
}

export const create = async (type: string, configDir: string, { customizeContent }: { customizeContent: (configDir: string, overrideFile: string, content: string) => Promise<string> }): Promise<(Instruction | Section<Instruction>)[]> => {
    const instructions: (Instruction | Section<Instruction>)[] = [];

    const overrideContent = await customizeContent(configDir, DEFAULT_INSTRUCTIONS_COMPOSE_FILE, INSTRUCTIONS_PROCESS);

    const factory = INSTRUCTIONS_FACTORIES[type];
    if (factory) {
        instructions.push(...await factory(configDir, { customizeContent }));
    }

    const instruction = createInstruction(overrideContent);
    instructions.push(instruction);

    return instructions;
}

