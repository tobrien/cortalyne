import * as Logging from '@/logging';
import * as ClassifyPhase from '@/phases/classify';
import * as TranscribePhase from '@/phases/transcribe';
import * as ComposePhase from '@/phases/compose';
import * as LocatePhase from '@/phases/locate';
import * as CompletePhase from '@/phases/complete';
import * as Cabazooka from '@tobrien/cabazooka';
import { Config } from '@/cortalyne';
export interface ClassifiedTranscription {
    text: string;
    type: string;
    subject: string;
}

export interface Instance {
    process(file: string): Promise<void>;
}

// Helper function to promisify ffmpeg.
export const create = (config: Config, operator: Cabazooka.Operator): Instance => {
    const logger = Logging.getLogger();

    const transcribePhase: TranscribePhase.Instance = TranscribePhase.create(config, operator);
    const classifyPhase: ClassifyPhase.Instance = ClassifyPhase.create(config, operator);
    const composePhase: ComposePhase.Instance = ComposePhase.create(config);
    const locatePhase: LocatePhase.Instance = LocatePhase.create(config, operator);
    const completePhase: CompletePhase.Instance = CompletePhase.create(config);

    const process = async (audioFile: string) => {
        logger.verbose('Processing file %s', audioFile);

        // Locate the contents in time and on the filesystem
        logger.debug('Locating file %s', audioFile);
        const { creationTime, outputPath, contextPath, interimPath, transcriptionFilename, hash } = await locatePhase.locate(audioFile);
        logger.debug('Locate complete: %s', JSON.stringify({ creationTime, outputPath, contextPath, interimPath, transcriptionFilename, hash }));

        // First transcribe the audio
        logger.debug('Transcribing file %s', audioFile);
        const transcription = await transcribePhase.transcribe(creationTime, outputPath, contextPath, interimPath, transcriptionFilename, hash, audioFile);

        // Then classify the transcription
        logger.debug('Classifying transcription for file %s', audioFile);
        const classifiedTranscription: ClassifiedTranscription = await classifyPhase.classify(creationTime, outputPath, contextPath, interimPath, transcription.text, hash, transcription.audioFileBasename);

        // Create the note
        const noteFilename = await operator.constructFilename(creationTime, classifiedTranscription.type, hash, { subject: classifiedTranscription.subject });
        logger.debug('Composing Note %s in %s', noteFilename, outputPath);
        await composePhase.compose(classifiedTranscription, outputPath, contextPath, interimPath, noteFilename, hash);

        // Move the processed file to the processed directory
        logger.debug('Completing processing for %s', audioFile);
        await completePhase.complete(
            classifiedTranscription.type,
            classifiedTranscription.subject,
            hash,
            creationTime,
            audioFile
        );

        logger.info('Processed file %s', audioFile);
        return;
    }

    return {
        process,
    }
}


