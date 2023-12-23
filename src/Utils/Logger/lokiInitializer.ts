import { LokiLogger } from './lokiController';

const myLogger = new LokiLogger();
export const getLogger = myLogger.getLogger.bind(myLogger);