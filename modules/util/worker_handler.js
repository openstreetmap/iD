import { createWorker } from './walkie_talkie';

var workerInstance = createWorker('dist/iD-worker.js');

export function parseBboxEntities(url, done) {
    workerInstance.sendMessage(
        { type: 'PARSE_BBOX_ENTITIES', url: url },
        function(error, reply) {
            done(error, reply);
        }
    );
}

export function authdParseBboxEntities(xhrParams, done) {
    workerInstance.sendMessage(
        { type: 'AUTHD_PARSE_BBOX_ENTITIES', xhrParams: xhrParams },
        function(error, reply) {
            done(error, reply);
        }
    );
}
