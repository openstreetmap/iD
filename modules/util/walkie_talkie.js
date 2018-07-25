var isWorker =
    typeof WorkerGlobalScope !== 'undefined' &&
    self instanceof WorkerGlobalScope;

export function createWorker(path) {
    var workerInstance;
    var uid = 0;
    var conversations = {};

    if (isWorker) {
        workerInstance = self;
        workerInstance.onmessage = function(event) {
            var data = event.data;
            var uid = data.uid;
            var payload = data.payload;
            workerInstance.processMessage(payload, function(error, reply) {
                workerInstance.postMessage({
                    reply: reply,
                    error: error,
                    uid: uid
                });
            });
        };
    } else {
        workerInstance = new Worker(path);
        workerInstance.addEventListener('message', function(event) {
            var data = event.data;
            var reply = data.reply;
            var error = data.error;
            var uid = data.uid;
            conversations[uid](error, reply);
            delete conversations[uid];
        });
    }

    return {
        sendMessage: function(payload, done) {
            if (!isWorker) {
                workerInstance.postMessage({ uid: ++uid, payload: payload });
                conversations[uid] = function(error, reply) {
                    done(error, reply);
                };
            }
        }
    };
}
