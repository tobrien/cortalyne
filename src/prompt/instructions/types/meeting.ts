import { createInstruction } from "@tobrien/minorprompt";

import { Section } from "@tobrien/minorprompt";

import { Instruction } from "@tobrien/minorprompt";
import { DEFAULT_TYPE_INSTRUCTIONS_DIR } from "../../../constants";

export const INSTRUCTION = `
Task #1 - Organize information from the raw transcript of an audio recording you made about a meeting into the format defined below.

Task #2 - Analyze the transcript of your recording and determine the participants, meeting initiation, tasks and follow-up actions, outcomes and decisions, and meeting summary if they are present.

Task #3 - Produce a note in Markdown format that is roughly the same length or longer than the original transcript of your recording that contains information about the meeting preserving as much detail as possible.

Remember that this is your meeting and you are capturing notes on your meeting.  When you write a note on a meeting that is yours, please use the word "I" to refer to yourself.

If there is context available, use it to help you identify people, projects, plans, and other entities mentioned in the transcript.

#### Instructions for Generating a Meeting Summary

A "meeting" summary typically includes the meeting title, participants, summary of activities or discussions, outcomes, key decisions, and follow-up tasks.

The summary should clearly indicate who attended, what was discussed, outcomes of discussions, decisions made, and any follow-up actions required.

The summary should also include all of the thoughts, ideas, emotions, feelings, and information shared in the transcript being careful not to change the meaning or content of the transcript as it is written.   The details should be almost as long as the original transcript content.

If the meeting notes are long, please capture as many notes as possible and don't truncate the contents to fit within a particular format.

#### Meeting Title

Determine the meeting title based on the following priority:

1. Explicitly stated title by the participants ("Meeting on Project Launch").
2. Clearly identified central or main subject of discussion.
3. General context if no explicit title is mentioned.

If the title isn't explicitly stated, indicate this clearly:

\`\`\`markdown
Title: *(Title not explicitly identified—suggested: "Project Launch Meeting")*
\`\`\`

#### Participants

List all meeting participants explicitly mentioned or clearly identified in the transcript:

\`\`\`markdown
## Participants
- John Doe
- Jane Smith
- Michael Brown
\`\`\`

Use the context provided to help you identify the participants.

#### Meeting Activities and Discussion

Capture clearly and concisely all activities, discussions, presentations, thoughts, or debates that took place during the meeting that were described in the transcript. Group logically related points together:

\`\`\`markdown
## Summary of Discussion
- Reviewed project timeline and milestones.
- Discussed budget constraints and possible solutions.
- Evaluated marketing strategies presented by the marketing team.
\`\`\`

#### Meeting Outcomes and Decisions

Explicitly state the key outcomes, agreements, or decisions made during the meeting:

\`\`\`markdown
## Outcomes and Decisions
- Agreed to extend the project timeline by two weeks.
- Decided on a revised budget allocation.
- Approved the proposed marketing plan with minor revisions.
\`\`\`

#### Follow-Up Tasks

Clearly document actionable follow-up tasks, indicating priority or status when relevant (e.g., "Urgent," "Overdue"):

\`\`\`markdown
## Follow-Up Tasks
- [Urgent] John Doe to finalize revised budget by Wednesday.
- Jane Smith to circulate the updated project timeline.
- Michael Brown to coordinate revisions to the marketing strategy.
\`\`\`

### Markdown Formatting Guidelines

- Use \`##\` headers for Participants, Summary of Discussion, Outcomes and Decisions, and Follow-Up Tasks.
- Use bullet points (\`-\`) for lists within each section.
- Bold important classifications or notes (e.g., **Urgent**, **Overdue**).

---

## Example Meeting Summary

\`\`\`markdown
Title: Quarterly Marketing Review

## Participants
- Alice Johnson
- Bob Williams
- Carlos Mendoza

## Meeting Activities and Discussion

- *Presented quarterly performance metrics.* - There was a somehwat detailed presentation of the quarterly performance metrics.  And the team delved into the details of the metrics with the charts.  This section can be very long if the transcript has a lot of information about a particular topic.

- Discussed the impact of recent marketing campaigns - No one had feedback, we move don quickly.

- Identified challenges in current lead generation strategies. - This was a very short section that just mentioned that there were some challenges in the current lead generation strategies.

## Outcomes and Decisions
- Decided to increase digital marketing budget by 15%.
- Approved new lead generation software.
- Scheduled training sessions for the sales team on new marketing tools.

## Follow-Up Tasks
- [Urgent] Alice Johnson to submit budget increase proposal by tomorrow.
- Bob Williams to organize software implementation meeting next week.
- Carlos Mendoza to arrange training schedule and distribute to sales team.
\`\`\`
`;

export const create = async (configDir: string, overrides: boolean, { customize }: { customize: (configDir: string, overrideFile: string, content: string, overrides: boolean) => Promise<string> }): Promise<(Instruction | Section<Instruction>)[]> => {
    const instructions: (Instruction | Section<Instruction>)[] = [];

    const overrideContent = await customize(configDir, DEFAULT_TYPE_INSTRUCTIONS_DIR + '/meeting.md', INSTRUCTION, overrides);
    const instruction = createInstruction(overrideContent);
    instructions.push(instruction);
    return instructions;
}