import { Section } from "@tobrien/minorprompt";

import { Instruction } from "@tobrien/minorprompt";

import { createInstruction } from "@tobrien/minorprompt";
import { DEFAULT_TYPE_INSTRUCTIONS_DIR } from "../../../constants";

export const INSTRUCTION = `
Task #1 - Organize information from the raw transcript that is about a call into the format defined below.

Task #2 - Analyze the transcript and determine the participants, call initiation, tasks and follow-up actions, outcomes and decisions, and call summary if they are present.

Task #3 - Produce a note in Markdown format that is roughly the same length or longer than the original transcript that contains information about the call preserving as much detail as possible.

If there is context available, use it the information in the context to help you identify people, projects, plans, and other entities mentioned in the transcript.

#### Instructions for Generating a Call Summary Note

A "call"-type note typically summarizes a telephone conversation, capturing essential details such as attendees, main activities, outcomes, follow-up actions, and the direction of call initiation.

Clearly indicate any missing details when necessary.

The call note should also make sure to capture all of the thoughts, ideas, emotions, feelings, and information shared in the transcript being careful not to change the meaning or content of the transcript as it is written.   The details should be almost as long as the original transcript content.

#### Call Title

The title should clearly reflect the subject or purpose of the call. Determine the title with the following priority:

1. Explicitly stated by the speaker ("call regarding sales targets").
2. Clearly identified subject discussed during the call.
3. General context inferred if no explicit title is mentioned.

If the title is not explicitly stated, indicate this explicitly:

\`\`\`markdown
Title: *(Title not explicitly identified—suggested: "Sales Target Discussion")*
\`\`\`

If the title isn't clear, use the subject from the transcript.

### Participants

List all individuals mentioned as being present on the call:

\`\`\`markdown
## Participants
- John Smith
- Jane Doe
- Alex Johnson
\`\`\`

#### Call Initiation

Clearly indicate who initiated the call:

- If the speaker initiated: "This call was initiated by the speaker."
- If someone else initiated: "This call was received by the speaker from [Caller's Name]."
- If unclear: Explicitly state uncertainty, e.g., "The call initiator was not clearly identified."

\`\`\`markdown
## Call Initiation
This call was initiated by the speaker.
\`\`\`

#### Tasks and Follow-Up Actions

Tasks or follow-up actions mentioned explicitly in the transcript should be listed clearly. Classify each task if relevant:

- **Urgent:** Requires immediate attention or specific near-term deadlines.
- **Overdue:** Mentioned explicitly as already past due.

Summarize tasks in a bulleted list:

\`\`\`markdown
## Tasks and Follow-Up Actions
- [Urgent] Schedule follow-up meeting with marketing by Thursday.
- [Overdue] Submit quarterly sales report immediately.
\`\`\`

#### Outcomes and Decisions

Clearly document any outcomes, agreements, or decisions made during the call. Summarize succinctly and clearly:

\`\`\`markdown
## Outcomes and Decisions
- Agreement reached to increase sales targets by 10%.
- Decision made to postpone the product launch until next quarter.
\`\`\`

#### Call Details (Body)

The Body section should contain a structured readout of the call capturing the topics, activities, and subjects discussed.

The readout should also contain any information about how the meeting unfolded, what was said, and what was decided in a more detailed format than the other sections.

If the dictator offer their own analysis of the call, include that in the readout as well.

Include information clearly and concisely, ensuring accuracy regarding any significant details:

\`\`\`markdown
## Call Details
John called me around Noon and started to talk about what he did on the weekend before anyone dialed.  We discussed his upcoming golf trip, but then we were interrupted when Sunny dialed in and we were getting ready to start discussing the plan. The team dialied in and we started about constraints in the budget, and eventually it became clear that no one was aware of the impending economic crisis."
\`\`\`

If the speaker explicitly requests verbatim text, clearly format this.   If the dictator says, "There was an interesting quote from Jackie, she said, 'The mountains are green and the sky is blue'", then the verbatim text should be in the note.

\`\`\`markdown
**Verbatim Dictation:**  
"We must finalize the sales strategy document by the end of this week and ensure that all stakeholders review it immediately."
\`\`\`

---

## Markdown Formatting Guidelines

- Use \`##\` headers for Participants, Call Initiation, Tasks and Follow-Up Actions, Outcomes and Decisions, and Call Summary.
- Use bullet points (\`-\`) for lists within these sections.
- Bold important classifications or notes.

---

## Example Call Details Note

\`\`\`markdown
Title: Q1 Sales Strategy Discussion

## Participants
- John Smith
- Jane Doe
- Alex Johnson

## Call Initiation
This call was received by the speaker from John Smith.

## Tasks and Follow-Up Actions
- [Urgent] Alex Johnson to prepare and send market analysis by tomorrow.
- Schedule follow-up call for Friday afternoon.

## Outcomes and Decisions
- Decision made to focus sales efforts on high-performing regions.
- Agreement to allocate additional budget to digital advertising.

## Call Details
The call began with John Smith outlining the current state of Q1 sales. Jane Doe provided insights into regional performance, suggesting increased investment in digital channels. Alex Johnson agreed to provide further analysis on regional trends. The call concluded with agreement on key actions and scheduling of follow-up discussions.
\`\`\`
`;

export const create = async (configDir: string, { customizeContent }: { customizeContent: (configDir: string, overrideFile: string, content: string) => Promise<string> }): Promise<(Instruction | Section<Instruction>)[]> => {
    const instructions: (Instruction | Section<Instruction>)[] = [];

    const overrideContent = await customizeContent(configDir, DEFAULT_TYPE_INSTRUCTIONS_DIR + '/call.md', INSTRUCTION);

    const instruction = createInstruction(overrideContent);
    instructions.push(instruction);

    return instructions;
}