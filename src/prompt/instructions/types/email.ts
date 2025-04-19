import { Instruction } from "@tobrien/minorprompt";

import { createInstruction } from "@tobrien/minorprompt";

import { Section } from "@tobrien/minorprompt";
import { DEFAULT_TYPE_INSTRUCTIONS_DIR } from "../../../constants";

export const INSTRUCTION = `
Task #1 - Organize information from the raw transcript about an email that is being described into the format defined below.

Task #2 - Analyze the transcript and determine if this is a discussion of a email to be created, revised, and reviewed, or if this is a discussion of an email that was received by the you.

Task #3 - Understand and capture ideas in the raw transcript about the email, and identify the recipients, subject, and any other details about the email including who might have been copied on the email or who might have responded to the email.

Task #4 - When reading the transcript look to directions to draft an email, and if the you asks you to draft an email, do so in the format defined below.    Also, if the user asks for multiple draft emails, separate them into multiple draft email sections.

#### Instructions for Generating an Email Note

An "email"-type note typically includes a subject, recipients, and optionally, sections or tasks necessary to compose an email.

Please note that the subject and recipients might not always be explicitly stated in the transcript. If they are not present, interpret the note as an email draft while clearly indicating missing details.

The email note should also make sure to capture all of the thoughts, ideas, emotions, feelings, and information shared in the transcript being careful not to change the meaning or content of the transcript as it is written.   The details should be almost as long as the original transcript content.

#### Verbatim Email Notes

If the transcript explicitly indicates a verbatim description (e.g., phrases like "this is the text of the email I need to send" or "take this text down verbatim"), the note should contain the verbatim content clearly formatted into paragraphs and logical line breaks.

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

This note is intended as a clear and structured starting point, though it might not be copied directly into an email client.

#### Recipients

Recipients can be identified through explicit statements:

- **To:** e.g., "I need to send an email to Dennis about the Boat Race."
- **Cc:** e.g., "We also need to copy Dennis and Jerry on this email."
- **Bcc:** e.g., "I need to also blind copy Tony."

If recipients are not explicitly identified, clearly indicate this in the output:

\`\`\`markdown
To: *(Recipient not explicitly identified)*
\`\`\`

#### Subject

The subject should be determined with the following priority:

1. Your made an Explicit statement in your audio recording ("email about Boat Race").
2. Clearly identified subject mentioned in your audio recording.
3. General context of the note if no explicit subject is mentioned.

If the subject is not explicitly stated, indicate this explicitly:

\`\`\`markdown
Subject: *(Subject not explicitly identified—suggested: "Boat Race")*
\`\`\`

#### Tasks

Tasks are actionable items explicitly indicated in the transcript. Tasks typically involve verbs such as "send," "reply," "contact," or "follow-up." Tasks can also have classifications:

- **Urgent:** e.g., "We urgently need to finalize the schedule by tomorrow."
- **Overdue:** e.g., "I totally forgot to confirm attendance yesterday—this is overdue."

Share tasks in a bulleted list:

\`\`\`markdown
## Tasks
- [Urgent] Finalize event schedule by tomorrow.
- [Overdue] Confirm attendance with Dennis.
\`\`\`

#### Sections

Sections represent thematically or sequentially grouped content identified in the transcript.  Capture the details clearly:

\`\`\`markdown
## Sections
- Event Planning
- Equipment Checklist
\`\`\`

#### Body

The Body contains the main content of the email or notes related to email content.

- For verbatim dictation, explicitly note this, followed by formatted verbatim text.
- For non-verbatim content, provide a structured outline of email content.

Clearly indicate and format corrections or restarts if present.

Ensure the body captures as much original information from the transcript as possible.

#### Markdown Formatting Guidelines

- Use \`##\` headers for Sections, Tasks, and Body.
- Use bullet points (\`-\`) for lists within Tasks and Sections.
- Bold important classifications or notes.

#### Drafting Emails

If the you asks you to draft an email, do so in the format defined and add a note that this section contains a draft email.     

Also, if the user asks for multiple draft emails, separate them into multiple draft email sections with statement the parameters of the draft proposed.

For example, if the you says, "I would like you to draft three versions of the email for Dennis.  Make one version in pirate speak, one version in a business-like tone, and another version in Spanish."   You would then have three draft sections each which provide a draft for those parameters.

\`\`\`markdown
## Draft 1: Title
[Draft 1 Content]

## Draft 2: Title
[Draft 2 Content]

## Draft 3: Title
[Draft 3 Content]
\`\`\`

---

#### Example Email Note

\`\`\`markdown
To: Dennis  
Cc: Jerry  
Bcc: Tony  
Subject: Boat Race  

## Sections
- Event Planning
- Equipment Checklist

## Tasks
- [Urgent] Confirm attendance with Dennis and Jerry by tomorrow.
- Check equipment availability.

## Body
This email should include details on event scheduling, equipment checklists, and special instructions for participants.

**Verbatim Dictation (Example):**  
"Dear Dennis,  
Please confirm your availability for the Boat Race scheduled for next Saturday. Jerry will also be joining us, and we need your confirmation urgently.  
Thanks,  
[Your Name]"
\`\`\`
`;

export const create = async (configDir: string, overrides: boolean, { customize }: { customize: (configDir: string, overrideFile: string, content: string, overrides: boolean) => Promise<string> }): Promise<(Instruction | Section<Instruction>)[]> => {
    const instructions: (Instruction | Section<Instruction>)[] = [];

    const overrideContent = await customize(configDir, DEFAULT_TYPE_INSTRUCTIONS_DIR + '/email.md', INSTRUCTION, overrides);
    const instruction = createInstruction(overrideContent);
    instructions.push(instruction);
    return instructions;
}