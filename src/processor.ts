import * as Logging from './logging';
import * as ClassifyPhase from './phases/classify';
import * as ComposePhase from './phases/compose';
import * as LocatePhase from './phases/locate';
import * as Cabazooka from '@tobrien/cabazooka';
import { Config } from './main';
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

    const classifyPhase: ClassifyPhase.Instance = ClassifyPhase.create(config, operator);
    const composePhase: ComposePhase.Instance = ComposePhase.create(config);
    const locatePhase: LocatePhase.Instance = LocatePhase.create(config, operator);

    const process = async (audioFile: string) => {
        logger.verbose('Processing file %s', audioFile);

        // Locate the contents in time and on the filesystem
        logger.debug('Locating file %s', audioFile);
        const { creationTime, outputPath, transcriptionFilename, hash } = await locatePhase.locate(audioFile);
        logger.debug('Locate complete: %s', JSON.stringify({ creationTime, outputPath, transcriptionFilename, hash }));

        // Create the transcription
        logger.debug('Classifying file %s', audioFile);
        const classifiedTranscription: ClassifiedTranscription = await classifyPhase.classify(creationTime, outputPath, transcriptionFilename, hash, audioFile);

        // // Create the note
        const noteFilename = await operator.constructFilename(creationTime, classifiedTranscription.type, hash, { subject: classifiedTranscription.subject });
        logger.debug('Composing Note %s in %s', noteFilename, outputPath);
        await composePhase.compose(classifiedTranscription, outputPath, noteFilename, hash);

        logger.info('Processed file %s', audioFile);
        return;
    }

    return {
        process,
    }
}


