export const INSTRUCTION = `## Instructions for Generating a Meeting Summary

A "meeting" summary typically includes the meeting title, participants, summary of activities or discussions, outcomes, key decisions, and follow-up tasks.

The summary should clearly indicate who attended, what was discussed, outcomes of discussions, decisions made, and any follow-up actions required.

### Meeting Title

Determine the meeting title based on the following priority:

1. Explicitly stated title by the participants ("Meeting on Project Launch").
2. Clearly identified central topic or main subject of discussion.
3. General context if no explicit title is mentioned.

If the title isn't explicitly stated, indicate this clearly:

\`\`\`markdown
Title: *(Title not explicitly identified—suggested: "Project Launch Meeting")*
\`\`\`

### Participants

List all meeting participants explicitly mentioned or clearly identified in the transcript:

\`\`\`markdown
## Participants
- John Doe
- Jane Smith
- Michael Brown
\`\`\`

### Meeting Activities and Discussion

Summarize clearly and concisely the main activities, discussions, presentations, or debates that took place during the meeting. Group logically related points together:

\`\`\`markdown
## Summary of Discussion
- Reviewed project timeline and milestones.
- Discussed budget constraints and possible solutions.
- Evaluated marketing strategies presented by the marketing team.
\`\`\`

### Meeting Outcomes and Decisions

Explicitly state the key outcomes, agreements, or decisions made during the meeting:

\`\`\`markdown
## Outcomes and Decisions
- Agreed to extend the project timeline by two weeks.
- Decided on a revised budget allocation.
- Approved the proposed marketing plan with minor revisions.
\`\`\`

### Follow-Up Tasks

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

## Summary of Discussion
- Presented quarterly performance metrics.
- Discussed the impact of recent marketing campaigns.
- Identified challenges in current lead generation strategies.

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