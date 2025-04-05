import { z } from 'zod';

import { INSTRUCTION as DEFAULT_EMAIL_INSTRUCTIONS } from './prompt/email';

import { INSTRUCTION as DEFAULT_DOCUMENT_INSTRUCTIONS } from './prompt/document';

import { INSTRUCTION as DEFAULT_MEETING_INSTRUCTIONS } from './prompt/meeting';

import { INSTRUCTION as DEFAULT_UPDATE_INSTRUCTIONS } from './prompt/update';

import { INSTRUCTION as DEFAULT_CALL_INSTRUCTIONS } from './prompt/call';

import { INSTRUCTION as DEFAULT_IDEA_INSTRUCTIONS } from './prompt/idea';

import { INSTRUCTION as DEFAULT_OTHER_INSTRUCTIONS } from './prompt/other';

export const VERSION = '__VERSION__ (__GIT_BRANCH__/__GIT_COMMIT__ __GIT_TAGS__ __GIT_COMMIT_DATE__) __SYSTEM_INFO__';
export const PROGRAM_NAME = 'transote';
export const DEFAULT_CHARACTER_ENCODING = 'utf-8';
export const DEFAULT_BINARY_TO_TEXT_ENCODING = 'base64';
export const DEFAULT_DIFF = true;
export const DEFAULT_LOG = false;
export const DATE_FORMAT_MONTH_DAY = 'MM-DD';
export const DATE_FORMAT_YEAR = 'YYYY';
export const DATE_FORMAT_YEAR_MONTH = 'YYYY-MM';
export const DATE_FORMAT_YEAR_MONTH_DAY = 'YYYY-MM-DD';
export const DATE_FORMAT_YEAR_MONTH_DAY_SLASH = 'YYYY/MM/DD';
export const DATE_FORMAT_YEAR_MONTH_DAY_HOURS_MINUTES = 'YYYY-MM-DD-HHmm';
export const DATE_FORMAT_YEAR_MONTH_DAY_HOURS_MINUTES_SECONDS = 'YYYY-MM-DD-HHmmss';
export const DATE_FORMAT_YEAR_MONTH_DAY_HOURS_MINUTES_SECONDS_MILLISECONDS = 'YYYY-MM-DD-HHmmss.SSS';
export const DATE_FORMAT_MONTH = 'MM';
export const DATE_FORMAT_DAY = 'DD';
export const DATE_FORMAT_HOURS = 'HHmm';
export const DATE_FORMAT_MINUTES = 'mm';
export const DATE_FORMAT_SECONDS = 'ss';
export const DATE_FORMAT_MILLISECONDS = 'SSS';
export const DEFAULT_VERBOSE = false;
export const DEFAULT_DRY_RUN = false;
export const DEFAULT_DEBUG = false;
export const DEFAULT_MODEL = 'gpt-4o-mini';
export const DEFAULT_TRANSCRIPTION_MODEL = 'whisper-1';
export const DEFAULT_CONTENT_TYPES = ['diff'];
export const DEFAULT_RECURSIVE = false;
export const DEFAULT_INPUT_DIRECTORY = './';
export const DEFAULT_OUTPUT_DIRECTORY = './';

export const DEFAULT_AUDIO_EXTENSIONS = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];

export const ALLOWED_CONTENT_TYPES = ['log', 'diff'];
export const ALLOWED_AUDIO_EXTENSIONS = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];

export const DEFAULT_CLASSIFIED_RESPONSE_SCHEMA = z.object({
    type: z.enum(['meeting', 'call', 'update', 'idea', 'email', 'document', 'other']),
    conferenceTool: z.enum(['zoom', 'phone', 'teams', 'none']).optional(),
    attendees: z.array(z.string()).optional(),
    subject: z.string().optional(),
    recipients: z.array(z.string()).optional(),
    sections: z.array(z.object({
        title: z.string(),
        description: z.string(),
    })).optional(),
    tasks: z.array(z.object({
        task: z.string(),
        urgency: z.enum(['urgent', 'important', 'none']).optional(),
        status: z.enum(['in-progress', 'completed', 'none', 'overdue']).optional(),
    })).optional(),
    text: z.string(),
});

export { INSTRUCTION as DEFAULT_CLASSIFY_INSTRUCTIONS } from './prompt/classify';

export { INSTRUCTION as DEFAULT_NOTE_INSTRUCTIONS } from './prompt/note';

export const NOTE_INSTRUCTION_TYPES = {
    email: DEFAULT_EMAIL_INSTRUCTIONS,
    document: DEFAULT_DOCUMENT_INSTRUCTIONS,
    meeting: DEFAULT_MEETING_INSTRUCTIONS,
    update: DEFAULT_UPDATE_INSTRUCTIONS,
    call: DEFAULT_CALL_INSTRUCTIONS,
    idea: DEFAULT_IDEA_INSTRUCTIONS,
    other: DEFAULT_OTHER_INSTRUCTIONS,
};