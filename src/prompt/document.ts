export const INSTRUCTION = `## Instructions for Generating a Document Note

A "document"-type note typically includes a document title, structured sections, tasks, and key ideas or points that must be addressed within the document.

Please note that the document title or specific sections might not always be explicitly stated in the transcript. Clearly indicate any missing details when necessary.

### Verbatim Document Notes

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

### Document Title

The title should be determined with the following priority:

1. Explicit statement by the speaker ("document on Company Policy Updates").
2. Clearly identified topic mentioned by the speaker.
3. General context of the note if no explicit title is mentioned.

If the title is not explicitly stated, indicate this explicitly:

\`\`\`markdown
Title: *(Title not explicitly identified—suggested: "Company Policy Updates")*
\`\`\`

### Tasks

Tasks are actionable items explicitly indicated in the transcript relevant to document creation. Tasks typically involve actions such as "include," "summarize," "verify," "review," or "finalize." Tasks can also have classifications:

- **Urgent:** e.g., "We urgently need to finalize section two by tomorrow."
- **Overdue:** e.g., "The summary of findings was supposed to be ready yesterday—this is overdue."

Summarize tasks in a bulleted list with appropriate classifications:

\`\`\`markdown
## Tasks
- [Urgent] Finalize the introduction by tomorrow.
- [Overdue] Summarize research findings from last week.
\`\`\`

### Sections

Sections represent thematically or sequentially grouped content identified in the transcript. Clearly outline these:

\`\`\`markdown
## Sections
- Introduction
- Methodology
- Results
- Conclusion
\`\`\`

### Body

The Body contains the primary content, key points, summaries, or specific language that must be included in the document.

- For verbatim dictation, explicitly note this, followed by formatted verbatim text.
- For non-verbatim content, provide a structured summary or key points clearly outlined.

Clearly indicate and format corrections or restarts if present.

Ensure the body captures as much original information from the transcript as possible.

## Markdown Formatting Guidelines

- Use \`##\` headers for Sections, Tasks, and Body.
- Use bullet points (\`-\`) for lists within Tasks and Sections.
- Bold important classifications or notes.

---

## Example Document Note

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