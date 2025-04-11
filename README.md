# Transote: Transcripts to Intelligent Notes

> **Note:** This utility is currently in pre-release status. Features and interfaces may change before the final release.

Transote is a powerful command-line utility that transforms audio recordings into intelligent, context-enhanced notes. It uses AI to transcribe, classify, and enhance audio content, making it more useful and actionable.

## How It Works

Transote processes each audio file through three distinct phases:

### 1. Locate Phase

The locate phase handles the initial setup for processing:
- Extracts the creation time from the audio file metadata
- Calculates a unique hash identifier for the file
- Determines the appropriate output directory based on configured structure
- Constructs the base filename for the output files

### 2. Classify Phase

The classify phase transforms audio into structured data:
- Transcribes the audio file using OpenAI's Whisper model
- Sends the transcription to an AI model with a "classifier" persona
- Analyzes the content to identify the note type (meeting, email, call, etc.)
- Extracts key metadata like subject, attendees, and sections
- Stores the classification results as a JSON file for reference

### 3. Compose Phase

The compose phase creates the final intelligent note:
- Takes the classified transcription from the previous phase
- Selects type-specific instructions based on classification (meeting, email, etc.)
- Applies a "you" persona to represent the speaker's voice
- Generates a well-structured, enhanced markdown note
- Formats the content according to the note type's requirements

Each phase builds on the previous one, gradually transforming raw audio into a useful, structured note. If you run in debug mode, you can examine the intermediate files created during each phase.

## Features

- Simple command-line interface
- Support for multiple audio formats
- Automatic content classification
- Type-specific note formatting
- Recursive directory processing
- Configurable AI models

## Installation

### Requirements

- Node.js
- OpenAI API key (set in .env file)

### Option 1: Install from npm (Recommended)

```bash
# Install globally
npm install -g @tobrien/transote

# Create a .env file with your OpenAI API key in your working directory
echo "OPENAI_API_KEY=your-api-key" > .env
```

### Option 2: Install from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/transote.git
cd transote

# Install dependencies
npm install

# Build the project
npm run build

# Create a .env file with your OpenAI API key
echo "OPENAI_API_KEY=your-api-key" > .env
```

## Usage

### If installed globally:

```bash
# Run directly
transote --input-directory ./recordings --output-directory ./notes

# Or run with npx
npx @tobrien/transote --input-directory ./recordings --output-directory ./notes
```

### If not installed globally:

```bash
# Run with npx without installing
npx @tobrien/transote --input-directory ./recordings --output-directory ./notes
```

Additional options:
```bash
# Process files recursively
transote --input-directory ./recordings --output-directory ./notes --recursive

# Enable verbose logging
transote --input-directory ./recordings --output-directory ./notes --verbose

# Specify custom AI model
transote --input-directory ./recordings --output-directory ./notes --model gpt-4
```



## Output Files

Transote generates two output files for each processed audio file:

1. **JSON Classification File** (`filename.json`):
   - Contains structured data about the transcript
   - Includes classification of the note type (meeting, call, email, etc.)
   - Stores extracted metadata such as:
     - Meeting attendees
     - Subject/topic
     - Conference tool used (Zoom, Teams, etc.)
     - Recipients (for email type)
     - Tasks and their urgency/status
     - Content sections
   - Preserves the original transcript text

2. **Markdown Note File** (`filename.md`):
   - Contains the enhanced, formatted version of the transcript
   - Organized according to the note type
   - Includes relevant sections, headers, and formatting
   - Ready for use in note-taking applications or knowledge bases

The output files are saved to the directory specified with the `--output-directory` option.

## Command Line Options

Transote provides a variety of command line options to customize its behavior:

| Option | Description | Default |
|--------|-------------|---------|
| `-i, --input-directory <dir>` | Input directory containing audio files | `./recordings` |
| `-o, --output-directory <dir>` | Output directory for generated files | `./notes` |
| `-r, --recursive` | Process files recursively in input directory | `false` |
| `-a, --audio-extensions [ext...]` | Audio extensions to process | `mp3,mp4,wav,m4a` |
| `--model <model>` | OpenAI model to use for all operations | `gpt-4` |
| `--classify-model <model>` | Specific model for classification phase | Same as `--model` |
| `--compose-model <model>` | Specific model for composition phase | Same as `--model` |
| `--transcription-model <model>` | OpenAI transcription model | `whisper-1` |
| `--output-structure <type>` | Output directory structure | `none` |
| `--filename-options [options...]` | Filename format options | `date,time,subject` |
| `--context-directories [dirs...]` | Directories to search for context files | `[]` |
| `--config-dir <dir>` | Configuration directory | `~/.transote` |
| `--overrides` | Allow overrides of default configuration | `false` |
| `--openai-api-key <key>` | OpenAI API key | From env var |
| `--timezone <timezone>` | Timezone for date calculations | `UTC` |
| `--dry-run` | Perform a dry run without saving files | `false` |
| `--verbose` | Enable verbose logging | `false` |
| `--debug` | Enable debug logging | `false` |

### Examples

Process all audio files in the current directory:
```bash
transote --input-directory . --output-directory ./notes
```

Process files recursively with verbose logging:
```bash
transote --input-directory ./recordings --output-directory ./notes --recursive --verbose
```

Specify different models for classification and composition phases:
```bash
transote --classify-model gpt-4 --compose-model gpt-3.5-turbo --input-directory ./recordings
```

Use a single model for all AI operations:
```bash
transote --model gpt-4-turbo --input-directory ./recordings
```

Organize output files by date structure:
```bash
transote --input-directory ./recordings --output-structure month
```

Customize filename format:
```bash
transote --input-directory ./recordings --filename-options "time subject"
```

Use a custom configuration directory:
```bash
transote --input-directory ./recordings --config-dir ~/my-transote-config
```

Add context from existing knowledge:
```bash
transote --input-directory ./recordings --context-directories ./my-notes ./project-docs
```

### Debugging and Verbose Output

Transote provides options to control the level of output detail:

#### Verbose Mode

Use `--verbose` when you need more detailed information about the processing:

```bash
transote --input-directory ./recordings --verbose
```

Verbose mode provides additional information about each step of the process, including:
- File discovery and validation
- Transcription progress
- Classification decisions
- Composition details

#### Debug Mode

Use `--debug` when you need to inspect the actual prompts and responses sent to and received from the AI models:

```bash
transote --input-directory ./recordings --debug
```

**Important:** Debug mode creates additional files in your output directory:
- `filename.request.json`: The prompts sent to the AI models
- `filename.response.json`: The raw responses received from the AI models

Debug mode is particularly useful for:
- Troubleshooting issues with classification or composition
- Understanding how the AI interprets your audio content
- Customizing or extending Transote's functionality

### Output Organization

Transote provides flexible options for organizing your output files using the `--output-structure` and `--filename-options` parameters.

#### Output Directory Structure

The `--output-structure` option determines how files are organized in subdirectories:

| Option | Description | Example Path |
|--------|-------------|--------------|
| `none` | All files in the output directory (default) | `./notes/meeting.md` |
| `year` | Organize by year | `./notes/2023/meeting.md` |
| `month` | Organize by year and month | `./notes/2023/07/meeting.md` |
| `day` | Organize by year, month, and day | `./notes/2023/07/15/meeting.md` |


Examples:

```bash
# All files in a flat structure
transote --output-structure none

# Organize by year
transote --output-structure year

# Organize by year and month
transote --output-structure month

# Organize by year, month, and day
transote --output-structure day
```

**Important Note on Filenames:** 
All output files include a mandatory hash code in the filename that uniquely identifies and relates the output to the original audio file input. This hash ensures that files can be properly tracked and associated with their source recordings.

For example, an actual filename might look like:
```
2023-07-15_143027_weekly_standup_a7f3b2c1.md
```

Where:
- `2023-07-15` is the date (if date option enabled)
- `143027` is the time (if time option enabled)
- `weekly_standup` is the subject (if subject option enabled)
- `a7f3b2c1` is the hash code (always included)

The examples below use simplified filenames for clarity.

#### Filename Options

The `--filename-options` parameter controls what information is included in filenames:

| Option | Description | Example |
|--------|-------------|---------|
| `date` | Include date (YYYY-M-D) | `2023-07-15-2d4ee3.md` |
| `time` | Include time (HHmm) | `1430-2d4ee3.md` |
| `subject` | Include subject from classification | `2d4ee3-weekly_standup.md` |
| `date`, `subject` | Include both the date and the subject | `15-2d4ee3-weekly_standup.md`|

You can combine these options in any order:

```bash
# Include only date in filename
transote --filename-options date

# Include date and subject
transote --filename-options date subject

# Include all options
transote --filename-options date time subject
```

**Important Note on Date Format:**
When using the `date` filename option, the date format changes based on the selected `--output-structure` to avoid redundant information:

| Output Structure | Date Format in Filename | Example |
|------------------|-------------------------|---------|
| `none` | YYYY-M-D | `2023-7-15-2d4ee3.md` |
| `year` | M-D | `7-15-2d4ee3.md` |
| `month` | D | `15-2d4ee3.md` |
| `day` | (date option disabled) | This will cause an error |

This ensures that date information already represented in the directory structure is not duplicated in the filename.

**Important Note on Filenames:** 
All output files include a mandatory hash code in the filename that uniquely identifies and relates the output to the original audio file input. This hash ensures that files can be properly tracked and associated with their source recordings.

For example, an actual filename might look like:
```
2023-07-15_143027_weekly_standup_a7f3b2c1.md
```

Where:
- `2023-07-15` is the date (if date option enabled)
- `143027` is the time (if time option enabled)
- `weekly_standup` is the subject (if subject option enabled)
- `a7f3b2c1` is the hash code (always included)

The examples below use simplified filenames for clarity.


#### Example Combinations

Here are some examples of how different combinations will structure your files:

**Example 1:** Flat structure with date and subject
```
transote --output-structure none --filename-options date subject
```
Result:
```
./notes/2023-07-15_weekly_standup.md
./notes/2023-07-16_client_meeting.md
```

**Example 2:** Monthly organization with time and subject
```
transote --output-structure month --filename-options time subject
```
Result:
```
./notes/2023/07/143027_weekly_standup.md
./notes/2023/07/093045_client_meeting.md
./notes/2023/08/113012_planning_session.md
```

**Example 3:** Daily organization with just subject
```
transote --output-structure day --filename-options subject
```
Result:
```
./notes/2023/07/15/weekly_standup.md
./notes/2023/07/16/client_meeting.md
./notes/2023/08/02/planning_session.md
```

**Note:** When using `--output-structure day`, the `date` filename option becomes redundant and is automatically disabled.

### Context-Enhanced Notes

Transote can enhance your notes with relevant context from existing files using the `--context-directories` option. This feature allows the AI to access and reference information from your knowledge base when processing audio recordings.

#### How Context Directories Work

When you specify one or more context directories, Transote will:
1. Search those directories for relevant files based on the content of your recording
2. Extract information from the most relevant files
3. Use this information to provide additional context for the AI when composing your note
4. Create more informed, connected notes that reference your existing knowledge

This is particularly useful for:
- Meeting notes that reference previous meetings
- Project updates that need historical context
- Ideas that build on previous concepts
- Any recording that would benefit from connection to your existing notes

#### Examples

Basic usage with a single context directory:
```bash
transote --input-directory ./recordings --context-directories ./my-notes
```

Using multiple context directories:
```bash
transote --input-directory ./recordings --context-directories ./my-notes ./project-docs ./reference-materials
```

Combined with other options:
```bash
transote --input-directory ./recordings --output-directory ./enhanced-notes --context-directories ./my-notes --model gpt-4
```

#### Best Practices

For optimal results with context directories:
- Organize your context files in a way that makes semantic sense
- Use descriptive filenames and clear content in your context files
- Consider using the `--verbose` flag to see which context files are being used
- Start with smaller context directories before scaling to larger knowledge bases

## Configuration and Customization

Transote can be customized using a configuration directory.

### Configuration Directory

By default, Transote looks for configuration files in `./.transote`. You can specify a different location:

```bash
transote --config-dir ~/my-transote-config
```

### Customizing Instructions

Transote uses AI instructions to classify and process your audio recordings. You can customize these instructions in three ways:

1. **Append content** - Add additional instructions at the end
2. **Prepend content** - Add additional instructions at the beginning
3. **Override content** - Completely replace the default instructions (requires `--overrides` flag)

#### File Naming Convention

For any instruction file, three variations are supported:

| Variation | Filename Format | Example | Effect |
|-----------|-----------------|---------|--------|
| Override | `filename.md` | `email.md` | Completely replaces default content |
| Prepend | `filename-pre.md` | `email-pre.md` | Adds content before default content |
| Append | `filename-post.md` | `email-post.md` | Adds content after default content |

#### Example: Customizing Email Type Instructions

To customize how Transote processes recordings identified as "email" type:

1. Create a directory structure in your config directory:
   ```
   .transote/
   └── instructions/
       └── types/
           ├── email.md           # Complete override (requires --overrides)
           ├── email-pre.md       # Content to prepend
           └── email-post.md      # Content to append
   ```

2. Run Transote with the `--overrides` flag if using complete overrides:
   ```bash
   transote --input-directory ./recordings --overrides
   ```

#### Example: Customizing You Persona

The "you" persona represents how the system interprets your recordings. To customize:

1. Create the following structure:
   ```
   .transote/
   └── personas/
       └── you/
           ├── traits.md           # Override traits
           ├── traits-pre.md       # Prepend traits
           ├── traits-post.md      # Append traits
           ├── instructions.md     # Override instructions
           ├── instructions-pre.md # Prepend instructions
           └── instructions-post.md # Append instructions
   ```

2. The traits files allow you to customize how the system views the persona of the speaker (you):
   - By default, it assumes you are summarizing your own notes
   - It values everything you record as important
   - It tries to be thorough and accurate in processing notes

3. The instructions files allow you to customize how the system processes your recordings:
   - How to handle unclear content
   - How to format and structure the output
   - Special rules for processing certain types of content

### Warning About Overrides

Complete overrides (using filename.md without the -pre or -post suffix) will replace core functionality and require the `--overrides` flag. Use with caution:

```bash
transote --input-directory ./recordings --overrides
```

Without this flag, Transote will refuse to run if override files exist to prevent accidental changes to core functionality.

### Available Customization Files

Transote supports customization for the following components:

#### Personas

| Persona | Description | File Paths in configDir |
|---------|-------------|------------|
| `classifier` | Determines the type of content in your recordings, this is the person used when analyzing and classifying a raw transcript | `/personas/classifier/traits.md`<br>`/personas/classifier/instructions.md` |
| `you` | Represents the speaker/recorder of the content, this is the persona used when composing a final version of a note. | `/personas/you/traits.md`<br>`/personas/you/instructions.md` |

#### Instructions

| Instruction | Description | File Path in configDir |
|-------------|-------------|-----------|
| `classify` | Instructions for classifying content | `/instructions/classify.md` |
| `compose` | Instructions for composing enhanced notes | `/instructions/compose.md` |

#### Note Types

| Type | Description | File Path in configDir |
|------|-------------|-----------|
| `meeting` | Meeting notes and summaries | `/instructions/types/meeting.md` |
| `call` | Call transcripts and summaries | `/instructions/types/call.md` |
| `update` | Status updates and reports | `/instructions/types/update.md` |
| `idea` | Personal ideas and brainstorming | `/instructions/types/idea.md` |
| `email` | Email drafts and correspondence | `/instructions/types/email.md` |
| `document` | Document outlines and drafts | `/instructions/types/document.md` |
| `other` | Miscellaneous content types | `/instructions/types/other.md` |

Remember that for each file path above, you can create three versions:
- The base file (e.g., `/personas/you/traits.md`) for complete override
- A "-pre" version (e.g., `/personas/you/traits-pre.md`) to prepend content
- A "-post" version (e.g., `/personas/you/traits-post.md`) to append content

All paths are relative to your configuration directory (default: `./.transote`).

### Customization Examples

Here are practical examples of how to customize Transote for specific needs:

#### Example 1: Pirate Language for Email Notes

Let's say you want all your email notes to be composed in pirate language. Create the following file:

```
.transote/
└── personas/
    └── you/
        └── traits-pre.md
```

Add this content to the `traits-pre.md` file:

```markdown
Everything you generate is using Pirate language. And you have to say "arrrr" every few sentences. You are a pirate captain on the Black Flag.
```

When Transote processes an audio file classified as "email" type, the output will now use pirate language.

#### Example 2: Spanish Translation for Ideas

To have all "idea" type notes translated to Spanish, create:

```
.transote/
└── instructions/
    └── types/
        └── idea-post.md
```

Add this content to the `idea-post.md` file:

```markdown
Translate all the output to Spanish, maintaining the same markdown formatting structure.
```

### Verifying Customizations

To verify your customizations are being applied correctly:

1. Run Transote in debug mode:
   ```bash
   transote --input-directory ./recordings --debug
   ```

2. Check the output directory for the `.request.json` files to see if your customized instructions are included in the prompts sent to the AI.

3. Examine the original source code (especially the files in `src/prompt/`) to understand the default configurations and how your changes might affect them.

### ⚠️ Important Caution

Customizing instructions can be powerful but comes with risks:

- Overriding default instructions may introduce errors or unexpected behavior
- Complex customizations could conflict with core processing logic
- Changes to key instructions might reduce the quality of transcription classification
- Significant modifications might require adjustments to the `--model` parameter

Start with small changes to the `-pre.md` and `-post.md` files before attempting complete overrides, and always test thoroughly with the `--debug` flag to monitor effects.



## Requirements

- Node.js
- OpenAI API key (set in .env file)


