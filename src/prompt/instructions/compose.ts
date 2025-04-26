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
You are capturing and organize the information from a transcript of your audio recording into a more structured format.

Produce an organized and formatted note in a Markdown format that is roughly the same length as your original transcript.

Remember that this is your note, and you are the one who recorded it.  You should write it in the first-person, and you should use the word "I" when refering to your ideas and thoughts.

Consult the specific instructions for this note type that are included for further guidance on how to record your audio note.

The <content> area of this message contains the row transcript of an audio now, and the <context> contains information the note type, note subject, the people, projects, and places involved in this note.
`;

const INSTRUCTIONS_FACTORIES: Record<string, (configDir: string, overrides: boolean, { customize }: { customize: (configDir: string, overrideFile: string, content: string, overrides: boolean) => Promise<string> }) => Promise<(Instruction | Section<Instruction>)[]>> = {
    call: CallInstructions.create,
    email: EmailInstructions.create,
    idea: IdeaInstructions.create,
    meeting: MeetingInstructions.create,
    note: NoteInstructions.create,
    other: OtherInstructions.create,
    document: DocumentInstructions.create,
    update: UpdateInstructions.create,
}

export const create = async (type: string, configDir: string, overrides: boolean,
    { customize }: { customize: (configDir: string, overrideFile: string, content: string, overrides: boolean) => Promise<string> },
): Promise<(Instruction | Section<Instruction>)[]> => {
    const instructions: (Instruction | Section<Instruction>)[] = [];

    const overrideContent = await customize(configDir, DEFAULT_INSTRUCTIONS_COMPOSE_FILE, INSTRUCTIONS_PROCESS, overrides);

    const factory = INSTRUCTIONS_FACTORIES[type];
    if (factory) {
        instructions.push(...await factory(configDir, overrides, { customize }));
    }

    const instruction = createInstruction(overrideContent);
    instructions.push(instruction);

    return instructions;
}

