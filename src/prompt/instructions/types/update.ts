import { createInstruction } from "@tobrien/minorprompt";
import { Instruction } from "@tobrien/minorprompt";
import { Section } from "@tobrien/minorprompt";
import { DEFAULT_TYPE_INSTRUCTIONS_DIR } from "../../../constants";

export const INSTRUCTION = `
Task #1 - You are capturing and organizing notes from the transcript of an audio recording you made of an update you gave on a topic.

Task #2 - Analyze the transcript and determine if your update is a continuation of a previous update, or if this is a new update from you.

Task #3 - If your update is about a project, a person, a place, or a thing, please identify what your update is related to in another field.

Task #4 - When reading the transcript look for directions to do research into this update and identify information that might need to be gathered to further develop the update.

Remember that this is your update and you are capturing notes on your update.  When you write a note on an update that is yours, please use the word "I" to refer to yourself.

## Instructions for Creating an Update Note

An **Update** note clearly captures and preserves a concept, thought, or suggestion. 

An update note does not require structured sections or bulleted lists, but if could be helpful to use them if the update is detailed and lengthy.

For a short update, it could be captured in a single sentence or paragraph, but for a length transcription the update note can be as long as it needs to be. 

- If your update is brief, capture it as concise bullet points.
- If your update is detailed or lengthy, capture details of your update clearly in paragraphs, ensuring no critical information is omitted.
- Use sections and bullet points if the update has multuple parts and sections.

The update note should also make sure to capture all of your thoughts, ideas, emotions, feelings, and information shared in the transcript being careful not to change the meaning or content of the transcript as it is written.   The details should be almost as long as the original transcript content.

---

### Update Note Formatting Guide


\`\`\`markdown
## Update: [Subject of the update]

- Clearly state the primary concept or insight.
- Include any details that were shared.
- Highlight notable considerations or potential applications.

## Update Details

Clearly describe your core concept or thought in the first paragraph, providing enough context to convey its purpose or potential immediately.

Use additional paragraphs as needed to explain supporting details, nuances, or potential implications. Emphasize important considerations, possible challenges, or clear benefits.

Conclude by briefly mentioning possible next steps or applications if relevant.

## Related People or Projects

- If your update is about a person, project, or thing, add a related people or projects section to the note.
- Describe how this idea may relate to an ongoing project.

## Tasks

- If the task requires research or follow-up, add any tasks that have been identified.
\`\`\`

---

### Example Update Notes:

\`\`\`markdown
## Update: We Need More Ice Cream

- The people have spoken, and we need more ice cream.
- There is a revolution afoot, we should be wary of the consequences.

## Update Details

I shared an idea about ice cream.  Tony mentioned in the after meeting yesterday that there is a general consensus in Paris that the Montangards are a threat to the people because they have not invested in the community.  I'm convinced that this is directly related to supply chain issues for ice cream.

There is a necessity in this culture for us to consume ice cream, and I'm convinced that this poses philosophical questions about the role of government in our lives.

## Related People or Projects

- Montangards
- Ice Cream
- Supply Chain

## Tasks

- Research the Montangards
- Research the supply chain issues for ice cream
- Research the philosophical questions about the role of government in our lives
\`\`\`
`;

export const create = async (configDir: string, { customizeContent }: { customizeContent: (configDir: string, overrideFile: string, content: string) => Promise<string> }): Promise<(Instruction | Section<Instruction>)[]> => {
    const instructions: (Instruction | Section<Instruction>)[] = [];

    const overrideContent = await customizeContent(configDir, DEFAULT_TYPE_INSTRUCTIONS_DIR + '/update.md', INSTRUCTION);
    const instruction = createInstruction(overrideContent);
    instructions.push(instruction);
    return instructions;
}