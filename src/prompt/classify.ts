export const INSTRUCTION = `The section "transcript" included below the "instructions" is a transcription of an audio note, and it is your job to figure out what type of note it is.

Analyze the text of the audio transcript that has been provided, and create a JSON object that matches the format of the "classifiedTranscript" object.

Please take the content of the transcript provided and copy that text context to the "text" property of the "classifiedTranscript" object.  Do not try to summarize that text, just copy it.

## Note Types

There are four types of notes: "meeting", "call", "update", "idea", and "other".

If it is a "meeting" note, the note will have a phase similar to "I have a meeting with John today," or "These are some notes about the meeting with had with the Law Department yesterday."

If it is a "call" note, the note will have a phase similar to "I had a call with John today," or "These are some notes about the call with had with the Law Department yesterday."   A "call" might also say something, "I just got a quick call from Tony."

If you have note about a "call" or a "meeting" there may also be a statement about what conference tool was user.  For example, you might have a phrase like, "I was on a Zoom call with Andy and Martin" for a "zoom" call, or you might have a statement like, "We all joined a Teams call" or "We were on Microsoft Teams for this meeting" for a "teams" meeting.

If it is an "update" note, the note will have a phase similar to "I had an update for the Law Department today," or "These are some notes about the update I had for the Law Department yesterday."

If it is an "email" note, then it will start with a phrase like, "Here are some notes for an email I need to send to Dennis about the New Product."   Or, an "email" type can have a statement like, "I really need to send an email to Dennis about the Boat Race, here are some things to include in that email."  In both cases, the recipient would be "Dennis" for the email.

If it is a "document" note, then it will start with a phrase like, "Here are some notes for a document that will capture the standards for efficiency."   The following transcript would be information about the "document" covering a subject of "standards for efficiency".

If it is an "idea" note, the note will have a phase similar to "I had an idea for a new product today," or "These are some notes about the idea I had for a new product yesterday."  There are also some long notes that are "ideas" because they appear to be a series of ideas that are not connected to a particular person or meeting.

If it is an "other" note, the note will have a phase similar to "I had a meeting with John today," or "These are some notes about the meeting with had with the Law Department yesterday."

## Sections

If a note is a "document" note, then there may be a statement about what the sections of the document are.  For example, "Here are some notes for a document that will capture the standards for efficiency."  In this same transcription there might be a statement like, "We need to start with an introduction, and then we need to have a section about the problem following by a section that has a solution."  In this case, the sections would have title like "introduction", "problem", and "solution".

If a note is about a "document", there may also be statements about what should be in each section.  For example, "In the introduction section, we should talk about Tony's dance expertise and also mention that he's certified in CPR."  That should be included in the "description" section of the subject.

## Conference Tool

If it is a "meeting" or a "call", there may be a statement about what conference tool was used.  For example, "I was on a Zoom call with Andy and Martin" would have a conferenceTool of "zoom".

If it is an "update" or an "idea" type, don't include a conferenceTool property in the context.  It will be very clear at the start of the transcript if this is about a meeting that happened on a conference tool.

Please also note that an "update" or an "idea" can talk about a past Zoom or Teams call, and still not be about that conference call.  If a long note simply mentions that there has been a call, it may not be necessary to include a conferenceTool.

## Subject

If it is an "email" note, then there may be a statement about what the subject of the email is.  For example, "I need to send an email to Dennis about the Boat Race" would have a subject of "Boat Race".   Or, an "email" note may have a sentence like, "I'm sending an email to Martha with the Subject 'Bandages Placate'".  In this case, the subject would be "Bandages Placate".

If it is a "meeting" or a "call", there may be a statement about what the subject of the meeting or call was.  For example, "I was on a Zoom call with Andy and Martin about the new product" would have a subject of "new product".

If it is an "update" note, there may be a statement about what the update is about.  For example, "I had an update for the Law Department about the Terms of Service Problems" would have a subject of "Terms of Service Problems".

If it is an "idea" note, there may be a statement about what the idea is about.  For example, "I had an idea for a new product to address the Transcription Multiplexing issue" would have a subject of "Transcription Multiplexing".

If it is an "other" note, there may be a statement about what the note is about.  For example, "I had a note about my depression" would have a subject of "depression".

## Attendees

If the note is a "meeting" or a "call", there may be a list of attendees.  For example, "I was on a Zoom call with Andy and Martin" would have two attendees, "Andy" and "Martin".  "We all joined a Teams call" would have "Multiple" for attendees if no names are specified.

If it is "meeting" or a "call", there may also be statements made throughout the text of the note about people that were in attendance.  If this is the case, add them to the list of attendees.

Also, I want to make sure that we don't just include "attendees" is there is a note.  If it appears that a transcription is just a phone call where the speaker is leaving notes about a subject, it doesn't have to include attendees at all.

Also, don't include any of the example names from the instructions, the names of people and departments in the instructions are just examples.

## Tasks

Throughout the transcript, there may be statements about tasks that need to be completed.  For example, "I need to send an email to Dennis about the Boat Race" would have a task of "send an email to Dennis about the Boat Race".

There also might be tasks that are flagged are urgent or important.  For example, if the transcript says, "I really cannot forget to send an email to Patrick about the Plans for Cost Reduction", then the task would be "send an email to Patrick about the Plans for Cost Reduction" and the classifier would be "urgent".

Or, if a transcript says something like, "I'm an idiot for not sending over the application for the new job role, it was due yesterday," then the task would be "send over the application for the new job role" and the status would be "overdue".

If a task is completed, then the status should be "completed".  If a task is in progress, then the status should be "in-progress".  If a task is not started, then the status should be "none".  If a task is overdue, then the status should be "overdue".

## Output

The output should be a JSON object that matches this format:

\${zodResponseFormat(DEFAULT_CLASSIFIED_RESPONSE_SCHEMA, 'classifiedTranscript')}
`; 