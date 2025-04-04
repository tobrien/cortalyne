# Transote: Transcripts to Intelligent Notes

> **Note:** This utility is currently in pre-release status. Features and interfaces may change before the final release.

Transote is a powerful command-line utility that transforms audio recordings into intelligent, context-enhanced notes. It uses AI to transcribe, classify, and enhance audio content, making it more useful and actionable.

## How It Works

1. **Transcription**: Converts audio files (mp3, mp4, wav, etc.) into text transcripts using OpenAI's Whisper model.

2. **Classification**: Analyzes the content using a large language model (GPT) to identify the type of note:
   - Meeting notes
   - Call summaries
   - Email drafts
   - Document outlines
   - Personal ideas
   - Status updates
   - Other content types

3. **Contextual Enhancement**: Applies specialized prompts based on the note type to structure and enhance the content, generating markdown files with proper formatting and organization.

## Features

- Simple command-line interface
- Support for multiple audio formats
- Automatic content classification
- Type-specific note formatting
- Recursive directory processing
- Configurable AI models

## Installation

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

## Requirements

- Node.js
- OpenAI API key (set in .env file)