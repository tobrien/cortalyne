import { Section } from "@tobrien/minorprompt";
import { Instruction } from "@tobrien/minorprompt";
import { createInstruction } from "@tobrien/minorprompt";
import { DEFAULT_TYPE_INSTRUCTIONS_DIR } from "../../../constants";

export const INSTRUCTION = `
Task #1 - Organize information from the raw transcript of an audio recording you made about a document that is being described into the format defined below.

Task #2 - Analyze the transcript and determine if this is a discussion of a document to be created, revised, and reviewed, or if this is a discussion of a document that already exists.

Task #3 - Understand and capture ideas in the raw transcript about the document's structure and content, and record them in the details section of the note.

Task #4 - Read the transcript and look for any questions that are identified about the document that need to be answered.    Also, record any external resources that are mentioned that should be used for research.

Task #5 - Read the transcript and look for any requests to draft a section of the document, or the draft the document.   If a request is made to draft a larger document, you can return a lengthy response.

Remember that this is your document and you are capturing notes on your document.  When you write a note on a document that is yours, please use the word "I" to refer to yourself.

#### Instructions for Generating a Document Note

A "document"-type note typically includes a document title, structured sections, tasks, and key ideas or points that must be addressed within the document.

Please note that the document title or specific sections might not always be explicitly stated in the transcript. Clearly indicate any missing details when necessary.

The document note should also make sure to capture all of the thoughts, ideas, emotions, feelings, and information shared in the transcript being careful not to change the meaning or content of the transcript as it is written.   The details should be almost as long as the original transcript content.

#### Verbatim Document Notes

If the transcript explicitly indicates a verbatim description (e.g., phrases like "include this text exactly," or "take this text down verbatim"), the note should contain the verbatim content clearly formatted into paragraphs and logical line breaks.

Corrections or restarts within verbatim dictations should be clearly documented. Include each distinct version under a dedicated subheading within the Body, as follows:

\`\`\`markdown
## Body

**Note:** This is a verbatim transcription with corrections/restarts:

### Version 1 (Discarded):
[Text...]

### Version 2 (Discarded):
[Text...]

### Final Accepted Version:
[Text...]
\`\`\`

This note is intended as a clear and structured starting point, though it might not be copied directly into a final document without review.

#### Document Title

The title should be determined with the following priority:

1. Your made an Explicit statement in your audio recording ("document on Company Policy Updates").
2. Clearly identified subject mentioned in your audio recording.
3. General context of the note if no explicit title is mentioned.

If the title is not explicitly stated, indicate this explicitly:

\`\`\`markdown
Title: *(Title not explicitly identified—suggested: "Company Policy Updates")*
\`\`\`

#### Tasks

Tasks are actionable items explicitly indicated in the transcript relevant to document creation. Tasks typically involve actions such as "include," "summarize," "verify," "review," or "finalize." Tasks can also have classifications:

- **Urgent:** e.g., "We urgently need to finalize section two by tomorrow."
- **Overdue:** e.g., "The summary of findings was supposed to be ready yesterday—this is overdue."

Share tasks in a bulleted list:

\`\`\`markdown
## Tasks
- [Urgent] Finalize the introduction by tomorrow.
- [Overdue] Summarize research findings from last week.
\`\`\`

#### Research and Resources

Notes about a document may include statements about research that needs to be done to create the document.   Record those in a section called "Research and Resources".

This transcipt may also have a list of web sites or external sources of information that should be consulted when creating the document.   Record those in a section called "Research and Resources".

#### Sections

Sections represent thematically or sequentially grouped content identified in the transcript. Clearly outline these:

\`\`\`markdown
## Sections
- Introduction
- Methodology
- Results
- Conclusion
\`\`\`

#### Draft Sections

If the yous ask for a draft of the document, you can return a lengthy response if required.    If draft is included please add it to a section called "Draft".

#### Body

The Body contains the primary content, ideas, outlines of sections, or specific language that was shared in the transcript.

This body should capture the same level of detail that was shared in the transcript, but should make effort to organize the information in a way that is easy to understand and use.

- For verbatim dictation, explicitly note this, followed by formatted verbatim text.
- For non-verbatim content, provide a structured readout of the details you shared in your audio recording.

Clearly indicate and format corrections or restarts if present.

Ensure the body captures as much original information from the transcript as possible.

#### Markdown Formatting Guidelines

- Use \`##\` headers for Sections, Tasks, and Body.
- Use bullet points (\`-\`) for lists within Tasks and Sections.
- Bold important classifications or notes.

---

#### Example Document Note

\`\`\`markdown
Title: Company Policy Updates

## Sections
- Remote Work Guidelines
- Employee Conduct
- Communication Standards

## Tasks
- [Urgent] Include updated remote work guidelines by Friday.
- Verify accuracy of employee conduct standards.

## Body
This document should clearly outline recent policy updates, particularly emphasizing remote work guidelines, standards for employee conduct, and internal communication protocols.

**Verbatim Dictation (Example):**  
"The company will now require all remote employees to check in with supervisors daily. Additionally, updated communication standards emphasize prompt responses within 24 hours for internal communications."
\`\`\`
`;

export const create = async (configDir: string, overrides: boolean, { customize }: { customize: (configDir: string, overrideFile: string, content: string, overrides: boolean) => Promise<string> }): Promise<(Instruction | Section<Instruction>)[]> => {
    const instructions: (Instruction | Section<Instruction>)[] = [];

    const overrideContent = await customize(configDir, DEFAULT_TYPE_INSTRUCTIONS_DIR + '/document.md', INSTRUCTION, overrides);
    const instruction = createInstruction(overrideContent);
    instructions.push(instruction);
    return instructions;
}