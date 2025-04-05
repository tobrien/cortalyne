export const INSTRUCTION = `## Instructions for Generating a Call Summary Note

A "call"-type note typically summarizes a telephone conversation, capturing essential details such as attendees, main activities, outcomes, follow-up actions, and the direction of call initiation.

Clearly indicate any missing details when necessary.

### Call Title

The title should clearly reflect the subject or purpose of the call. Determine the title with the following priority:

1. Explicitly stated by the speaker ("call regarding sales targets").
2. Clearly identified topic discussed during the call.
3. General context inferred if no explicit title is mentioned.

If the title is not explicitly stated, indicate this explicitly:

\`\`\`markdown
Title: *(Title not explicitly identified—suggested: "Sales Target Discussion")*
\`\`\`

### Participants

List all individuals mentioned as being present on the call:

\`\`\`markdown
## Participants
- John Smith
- Jane Doe
- Alex Johnson
\`\`\`

### Call Initiation

Clearly indicate who initiated the call:

- If the speaker initiated: "This call was initiated by the speaker."
- If someone else initiated: "This call was received by the speaker from [Caller's Name]."
- If unclear: Explicitly state uncertainty, e.g., "The call initiator was not clearly identified."

\`\`\`markdown
## Call Initiation
This call was initiated by the speaker.
\`\`\`

### Tasks and Follow-Up Actions

Tasks or follow-up actions mentioned explicitly in the transcript should be listed clearly. Classify each task if relevant:

- **Urgent:** Requires immediate attention or specific near-term deadlines.
- **Overdue:** Mentioned explicitly as already past due.

Summarize tasks in a bulleted list:

\`\`\`markdown
## Tasks and Follow-Up Actions
- [Urgent] Schedule follow-up meeting with marketing by Thursday.
- [Overdue] Submit quarterly sales report immediately.
\`\`\`

### Outcomes and Decisions

Clearly document any outcomes, agreements, or decisions made during the call. Summarize succinctly and clearly:

\`\`\`markdown
## Outcomes and Decisions
- Agreement reached to increase sales targets by 10%.
- Decision made to postpone the product launch until next quarter.
\`\`\`

### Call Summary (Body)

The Body section should contain a structured summary capturing the key points, activities, topics discussed, and important highlights or statements from the call.

Include information clearly and concisely, ensuring accuracy regarding any significant details:

\`\`\`markdown
## Call Summary
The call primarily focused on reviewing current sales performance and setting future targets. John Smith discussed the potential to increase targets by leveraging new marketing strategies. Jane Doe agreed to provide additional market analysis by the next meeting.
\`\`\`

If the speaker explicitly requests verbatim text, clearly format this:

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

## Example Call Summary Note

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

## Call Summary
The call began with John Smith outlining the current state of Q1 sales. Jane Doe provided insights into regional performance, suggesting increased investment in digital channels. Alex Johnson agreed to provide further analysis on regional trends. The call concluded with agreement on key actions and scheduling of follow-up discussions.
\`\`\`
`; 