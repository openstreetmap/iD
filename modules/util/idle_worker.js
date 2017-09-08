export function utilIdleWorker(tasks, processor, callback) {
    var processed = [];
    var currentPos = 0;
    var totalTasks = tasks.length;

    function worker(deadline) {
        while (deadline.timeRemaining() > 0 && currentPos < totalTasks) {
            var result = processor(tasks[currentPos]);

            // if falsy dont add to the processed list
            if (result) processed.push(result);
            currentPos++;
        }

        // more tasks are left, we might need more idleCallbacks
        if (currentPos < totalTasks) {
            return window.requestIdleCallback(function(deadline) {worker(deadline);});
        }

        // tasks are completed
        return callback(processed);
    }

    window.requestIdleCallback(function(deadline) {worker(deadline);});
}

// shim
window.requestIdleCallback =
    window.requestIdleCallback ||
    function(cb) {
        var start = Date.now();
        return setTimeout(function() {
            cb({
                didTimeout: false,
                timeRemaining: function() {
                    return Math.max(0, 50 - (Date.now() - start));
                }
            });
        }, 1);
    };

window.cancelIdleCallback =
    window.cancelIdleCallback ||
    function(id) {
        clearTimeout(id);
    };
