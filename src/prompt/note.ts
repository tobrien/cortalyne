export const INSTRUCTION = `I want you create a note from the transcript of an audio note.   This transcript has been analyzed and classified into a type of note, and the format and instructions for generating the note are included below.

The section "classifiedTranscript" included below the "instructions" contains data about a trascription of an audio note.

## classifiedTranscript Format

The classifiedTranscript should be a JSON object that matches this format:

\${zodResponseFormat(DEFAULT_CLASSIFIED_RESPONSE_SCHEMA, 'classifiedTranscript')}

## Output Format

The output should be a Markdown formatted note that follows the format of the instructions for the type of note.`; 