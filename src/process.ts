import * as Logging from './logging';
import * as Output from './output';
import * as ClassifyPhase from './phases/classify';
import * as ComposePhase from './phases/compose';
import * as LocatePhase from './phases/locate';
import { ClassifiedTranscription, Instance } from './process.d';
import { Config as RunConfig } from './run.d';

// Helper function to promisify ffmpeg.

export const create = (runConfig: RunConfig): Instance => {
    const logger = Logging.getLogger();
    const output = Output.create(runConfig.timezone, runConfig.outputStructure, runConfig.filenameOptions);

    const classifyPhase: ClassifyPhase.Instance = ClassifyPhase.create(runConfig);
    const composePhase: ComposePhase.Instance = ComposePhase.create(runConfig);
    const locatePhase: LocatePhase.Instance = LocatePhase.create(runConfig);

    const process = async (audioFile: string) => {
        logger.verbose('Processing file %s', audioFile);

        // Locate the contents in time and on the filesystem
        logger.debug('Locating file %s', audioFile);
        const { creationTime, outputPath, transcriptionFilename, hash } = await locatePhase.locate(audioFile);


        // Create the transcription
        logger.debug('Classifying file %s', audioFile);
        const classifiedTranscription: ClassifiedTranscription = await classifyPhase.classify(creationTime, outputPath, transcriptionFilename, hash, audioFile);

        // // Create the note
        const noteFilename = output.constructFilename(creationTime, classifiedTranscription.type, hash, { subject: classifiedTranscription.subject });
        logger.debug('Composing Note %s in %s', noteFilename, outputPath);
        await composePhase.compose(classifiedTranscription, outputPath, noteFilename, hash);

        logger.info('Processed file %s', audioFile);
        return;
    }

    return {
        process,
    }
}


