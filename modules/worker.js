import { workerParseBbox, workerAuthdParseBbox } from './worker/parse_bbox';
import { createWorker } from './util/walkie_talkie';

createWorker();

self.processMessage = function(payload, done) {
    switch (payload.type) {
        case 'PARSE_BBOX_ENTITIES': {
            return workerParseBbox(payload.url, done);
        }
        case 'AUTHD_PARSE_BBOX_ENTITIES': {
            return workerAuthdParseBbox(payload.xhrParams, done);
        }
        default: {
            done('Unknown type:' + payload.type);
            console.error('Unknown type:' + payload.type);
        }
    }
};
