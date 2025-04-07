import { createInstruction } from "@tobrien/minorprompt";
import { Instruction } from "@tobrien/minorprompt";
import { Section } from "@tobrien/minorprompt";
import { DEFAULT_TYPE_INSTRUCTIONS_DIR } from "../../../constants";

export const INSTRUCTION = `
Task #1 - Organize information from the raw transcript about an idea that the dictator has about a subject.

Task #2 - Analyze the transcript and determine if this idea is a continuous of a previous note related to this idea, or if this is a new idea.

Task #3 - If the idea is about a project, a person, a place, or a thing, please identify what this idea is related to in another field.

Task #4 - When reading the transcript look to directions to do research into this idea and identify information that might need to be gathered to further develop the idea.

## Instructions for Creating an Idea Note

An **Idea** note clearly captures and preserves a concept, thought, or suggestion. 

An idea note does not require structured sections or bulleted lists, but if could be helpful to use them if the idea is detailed and lengthy.

For a short idea, it could be captured in a single sentence or paragraph, but for a length transcription the idea note can be as long as it needs to be. 

- If the idea is brief, capture it as concise bullet points.
- If detailed or lengthy, summarize it clearly in paragraphs, ensuring no critical information is omitted.
- Use sections and bullet points if the idea is detailed and lengthy or if the idea has multuple parts and sections.

The idea note should also make sure to capture all of the thoughts, ideas, emotions, feelings, and information shared in the transcript being careful not to change the meaning or content of the transcript as it is written.   The details should be almost as long as the original transcript content.

---

### Idea Note Formatting Guide


\`\`\`markdown
## Idea: [Subject of the idea]

- Clearly state the primary concept or insight.
- Include any details that were shared.
- Highlight notable considerations or potential applications.

## Idea Details

Clearly describe the core concept or thought in the first paragraph, providing enough context to convey its purpose or potential immediately.

Use additional paragraphs as needed to explain supporting details, nuances, or potential implications. Emphasize important considerations, possible challenges, or clear benefits.

Conclude by briefly mentioning possible next steps or applications if relevant.

## Related People or Projects

- If the idea is about a person, project, or thing, add a related people or projects section to the note.
- Describe how this idea may relate to an ongoing project.

## Tasks

- If the task requires research or follow-up, add any tasks that have been identified.
\`\`\`

---

### Example Idea Notes:

\`\`\`markdown
## Idea: We Need More Ice Cream

- The people have spoken, and we need more ice cream.
- There is a revolution afoot, we should be wary of the consequences.

## Idea Details

Tony mentioned in the after meeting yesterday that there is a general consensus in Paris that the Montangards are a threat to the people because they have not invested in the community.  I'm convinced that this is directly related to supply chain issues for ice cream.

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

    const overrideContent = await customizeContent(configDir, DEFAULT_TYPE_INSTRUCTIONS_DIR + '/idea.md', INSTRUCTION);
    const instruction = createInstruction(overrideContent);
    instructions.push(instruction);
    return instructions;
}