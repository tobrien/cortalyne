import { createInstruction } from "@tobrien/minorprompt";
import { Instruction } from "@tobrien/minorprompt";
import { Section } from "@tobrien/minorprompt";
import { DEFAULT_TYPE_INSTRUCTIONS_DIR } from "../../../constants";

export const INSTRUCTION = `
Task #1 - Organize information from the raw transcript about a miscellaneous note that you have about a topic or a project.

Task #2 - If your note is about a project, a person, a place, or a thing, please identify what your note is related to in another field.

Task #3 - When reading the transcript look for directions to do research into this note and identify information that might need to be gathered to further develop the note.

Remember that this is your note and you are capturing notes on your note.  When you write a note on an other note that is yours, please use the word "I" to refer to yourself.

In addition to refering to yourself as "I", please make sure not to overuse the word "I".   If you stated something in your own now, you can just record the thought here without using the work "I".  For example, if you said, "it's time to go to the gym", you can just report "it's time to go to the gym."  You do not have to add "I said it is time to go to the gym."  Avoid referring to yourself as "I" if you are just reporting on someting you said.

## Instructions for Creating an Other Note

An **Other** note captures and preserves a concept, thought, or suggestion, but it isn't clear what type of note it is.

An other note does not require structured sections or bulleted lists, but if could be helpful to use them if the other note is detailed and lengthy.

For a short other note, it could be captured in a single sentence or paragraph, but for a length transcription the other note can be as long as it needs to be. 

- If your note is brief, capture it as concise bullet points.
- If your note is detailed or lengthy, capture details of your note clearly in paragraphs, ensuring no critical information is omitted.
- Use sections and bullet points if the note has multuple parts and sections.

The other note should also make sure to capture all of the thoughts, ideas, emotions, feelings, and information shared in the transcript being careful not to change the meaning or content of the transcript as it is written.   The details should be almost as long as the original transcript content.

---

### Other Note Formatting Guide


\`\`\`markdown
## Other: [Subject of the other note]

- Clearly state the primary concept or insight.
- Include any details that were shared.
- Highlight notable considerations or potential applications.

## Other Details

Clearly describe your core concept or thought in the first paragraph, providing enough context to convey its purpose or potential immediately.

Use additional paragraphs as needed to explain supporting details, nuances, or potential implications. Emphasize important considerations, possible challenges, or clear benefits.

Conclude by briefly mentioning possible next steps or applications if relevant.

## Related People or Projects

- If your note is about a person, project, or thing, add a related people or projects section to the note.
- Describe how this note may relate to an ongoing project.

## Tasks

- If the task requires research or follow-up, add any tasks that have been identified.
\`\`\`

---

### Example Other Notes:

\`\`\`markdown
## Other: We Need More Ice Cream

- The people have spoken, and we need more ice cream.
- There is a revolution afoot, we should be wary of the consequences.

## Other Details

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

    const overrideContent = await customizeContent(configDir, DEFAULT_TYPE_INSTRUCTIONS_DIR + '/other.md', INSTRUCTION);
    const instruction = createInstruction(overrideContent);
    instructions.push(instruction);
    return instructions;
}