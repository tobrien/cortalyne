# Classify

Task #1 - Analyze the transcript provided to determine the type of note that is being described.

Task #2 - Understand the contents of the note and create a Subject for the note from the trascript using the information in <context> to correct spelling related to names, projects, companies, and other entities.

Task #3 - Review the Raw Transcipt and Identify Tasks that have either been completed, are overdue, or are in progress use the information in <context> to correct spelling related to names, projects, companies, and other entities.

Task #4 - If the note is about a meeting or a call, review the content and create a list of people who attended the meeting or call using the information in <context> to correct spelling related to names, projects, companies, and other entities.

Task #5 - If the note is about a document or an email, try to identify what sections the document or email has from the transcript content using the information in <context> to correct spelling related to names, projects, companies, and other entities.

The section "transcript" included below in the content area is a transcription of an audio note, and it is your job to figure out what type of note it is.

## Output Format

Analyze the text of the audio transcript that has been provided, and create a JSON object that matches the format of the "classifiedTranscript" object.

Please take the content of the transcript provided and copy that text context to the "text" property of the "classifiedTranscript" object.  Do not try to summarize that text, just copy it.

## Identify Note Types

When possible the speaker will start with a sentence that identifies the type of note.  For example, "I have a meeting with John today" or "These are some notes about the meeting with had with the Law Department yesterday" or "This note is about an email I need to write for Janet on the Budget." 

There are different types of notes that can be classified.  The following are the types of notes that can be classified along with hints for identifying the type of note.

### Notes about Meetings and Calls

* "meeting" note type - the note will have a phase similar to "I have a meeting with John today," or "These are some notes about the meeting wehad with the Law Department yesterday."

* "call" note types, the note will have a phase similar to "I had a call with John today," or "These are some notes about the call with had with the Law Department yesterday."   A "call" might also say something, "I just got a quick call from Tony."

If you have note about a "call" or a "meeting" there may also be a statement about what conference tool was used.  For example, you might have a phrase like, "I was on a Zoom call with Andy and Martin" for a "zoom" call, or you might have a statement like, "We all joined a Teams call" or "We were on Microsoft Teams for this meeting" for a "teams" meeting.

Notes about meetings and calls will often mention the names of people who were in attendance.   Use the context provided to hekp identify who was attending.

In a meeting or a call, the transcript may summarize "follow ups" or "next steps" that need to be taken.  If this is the case, add them to the list of tasks.

### Notes about Emails and Documents

* If it is an "email" note, then it will start with a phrase like, "Here are some notes for an email I need to send to Dennis about the New Product."   Or, an "email" type can have a statement like, "I really need to send an email to Dennis about the Boat Race, here are some things to include in that email."  In both cases, the recipient would be "Dennis" for the email.

* If it is a "document" note, then it will start with a phrase like, "Here are some notes for a document that will capture the standards for efficiency."   The following transcript would be information about the "document" covering a subject of "standards for efficiency".

Document and email notes can also be about emails and documents that have already been sent or received.

### Notes about Ideas and Updates

There are notes that are about generate ideas that the speaker wants to remember or explore, there are also notes that are about updates and follow up to previous notes.

* If it is an "idea" note, the note will have a phase similar to "I had an idea for a new product today," or "These are some notes about the idea I had for a new product yesterday."  There are also some long notes that are "ideas" because they appear to be a series of ideas that are not connected to a particular person or meeting.

* An "idea" may also start with a phrase like, "I was thinking about..." or "I'm struggling with some of the challenges of..." or "I'm trying to figure out how to...".

* If it is an "update" note, the note will have a phase similar to "I had an update for the Law Department today," or "These are some notes about the update I had for the Law Department yesterday."

* An "update" transcript will be more direct and will cover something that has already happened.   There can be updates "on progres" or updates on the status of a project.

When an update or and idea is identifies it is importat to analyze the message to delermine a subject.

### Other Notes

* If the note doesn't contain content that aligns with any of the types listed about, they it is to be placed in an "other" category.

## Identify Sections

If a note is a "document" note, then there may be a statement about what the sections of the document are.  For example, "Here are some notes for a document that will capture the standards for efficiency."  In this same transcription there might be a statement like, "We need to start with an introduction, and then we need to have a section about the problem following by a section that has a solution."  In this case, the sections would have title like "introduction", "problem", and "solution".

If a note is about a "document", there may also be statements about what should be in each section.  For example, "In the introduction section, we should talk about Tony's dance expertise and also mention that he's certified in CPR."  That should be included in the "description" section of the subject.

The transcript may also not directly use the terms "section" or "chapters" - in some cases, a speaker might say, "We need to introduct this topic and also cover the challenge and history associated with this topic."  In this case, please try to assume what sections will need to be present.

## Identify Conference Tool

If it is a "meeting" or a "call", there may be a statement about what conference tool was used.  For example, "I was on a Zoom call with Andy and Martin" would have a conference tool of "zoom".

If it is an "update" or an "idea" type, don't include a conference tool property in the context.  It will be very clear at the start of the transcript if this is about a meeting that happened on a conference tool.

Please also note that an "update" or an "idea" can talk about a past Zoom or Teams call, and still not be about that conference call.  If a long note simply mentions that there has been a call or a meeting the not may not be about that particular meeting.

## Identify Subject

If it is an "email" note, then there may be a statement about what the subject of the email is.  For example, "I need to send an email to Dennis about the Boat Race" would have a subject of "Boat Race".   Or, an "email" note may have a sentence like, "I'm sending an email to Martha with the Subject 'Bandages Placate'".  In this case, the subject would be "Bandages Placate".

If it is a "meeting" or a "call", there may be a statement about what the subject of the meeting or call was.  For example, "I was on a Zoom call with Andy and Martin about the new product" would have a subject of "new product".

If it is an "update" note, there may be a statement about what the update is about.  For example, "I had an update for the Law Department about the Terms of Service Problems" would have a subject of "Terms of Service Problems".

If it is an "idea" note, there may be a statement about what the idea is about.  For example, "I had an idea for a new product to address the Transcription Multiplexing issue" would have a subject of "Transcription Multiplexing".

If it is an "other" note, there may be a statement about what the note is about.  For example, "I had a note about my depression" would have a subject of "depression".

Most subjects are going to be refer to projects, people, companies, or other entities that may be present in the context and the context should be used to both check spelling and the infer the identity of the subject.

## Identify People

If the note is a "meeting" or a "call", there may be a list of attendees.  For example, "I was on a Zoom call with Andy and Martin" would have two attendees, "Andy" and "Martin".  "We all joined a Teams call" would have "Multiple" for attendees if no names are specified.

If it is "meeting" or a "call", there may also be statements made throughout the text of the note about people that were in attendance.  If this is the case, add them to the list of attendees.

Also, I want to make sure that we don't just include "attendees" is there is a note.  If it appears that a transcription is just a phone call where the speaker is leaving notes about a subject, it doesn't have to include attendees at all.

Also, don't include any of the example names from the instructions, the names of people and departments in the instructions are just examples.

Look in the context to for names of projects, people, companies, or other entities that might be relevant and use the relationships between those entities to infer identity.  For example, if the context has a note about a Sales Engineer named Brian who works for a company named Omnicorp and transcript says something like, "We had this meeting with Brian, and it was difficult because Omnicorp is a big company."  In this case, Brian should be identify as a potential attendee.

If the note contains both a first and last name, and that first and last name is present for a person in the context, then that person should be identified as an attendee.

If the note contains any portion of a name that resembles a name in the context, use the context to check spelling.  For example, if the transcript says, "We met with Anull today and discussed a project" and there is a person named "Anil" in the context, then it is likely that the transcript has misspelled the name.

## Identify Tasks

Throughout the transcript, there may be statements about tasks that need to be completed.  For example, "I need to send an email to Dennis about the Boat Race" would have a task of "send an email to Dennis about the Boat Race".

There also might be tasks that are flagged as urgent or important.  For example, if the transcript says, "I really cannot forget to send an email to Patrick about the Plans for Cost Reduction", then the task would be "send an email to Patrick about the Plans for Cost Reduction" and the classifier would be "urgent".

Or, if a transcript says something like, "I'm an idiot for not sending over the application for the new job role, it was due yesterday," then the task would be "send over the application for the new job role" and the status would be "overdue".

If a task is completed, then the status should be "completed".  If a task is in progress, then the status should be "in-progress".  If a task is not started, then the status should be "none".  If a task is overdue, then the status should be "overdue".

If a task is about a project, person, company, or other entity that is not present in the context, then it should be ignored.
