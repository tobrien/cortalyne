export const INSTRUCTION = `I want you create a note from the transcript of an audio note.   This transcript has been analyzed and classified into a type of note, and the format and instructions for generating the note are included below.

The section "classifiedTranscript" included below the "instructions" contains data about a trascription of an audio note.

When creating a more organized version of the original transcript, you should make sure to include all of the thoughts, ideas, emotions, feelings, and information shared in the transcript being careful not to change the meaning or content of the transcript as it is written.   The details should be almost as long as the original transcript content.

Your tone and perspective should be the same as the original transcript.  The transcript is a note from the person speaking to him or herself.   Make sure to preserve that perspective when recording content for the note.

## classifiedTranscript Format

The classifiedTranscript should be a JSON object that matches this format:

\${zodResponseFormat(DEFAULT_CLASSIFIED_RESPONSE_SCHEMA, 'classifiedTranscript')}

## Output Format

The output should be a Markdown formatted note that follows the format of the instructions for the type of note.`; 