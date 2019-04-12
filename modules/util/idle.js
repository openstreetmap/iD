// call a single function while idle.
// note the function should be of low priority
// and should not be returning a value.
export function utilCallWhenIdle(func, timeout) {
    return function() {
        var args = arguments;
        var that = this;
        window.requestIdleCallback(function() {
            func.apply(that, args);
        }, { timeout: timeout });
    };
}

// process queue while idle
export function utilIdleWorker(tasks, processor, callback) {

    // all tasks in single deferral
    utilCallWhenIdle(function() {
        var results = [];
        var result;
        for (var i = 0; i < tasks.length; i++) {
            result = processor(tasks[i]);
            if (result) results.push(result);
        }
        callback(results);
    })();

    // alternatively, each task deferred in its own callback
    // seems to not work because it

    // var processed = [];
    // var currentPos = 0;
    // var totalTasks = tasks.length;

    // function worker(deadline) {
    //     while (deadline.timeRemaining() > 0 && currentPos < totalTasks) {
    //         var result = processor(tasks[currentPos]);

    //         // if falsy dont add to the processed list
    //         if (result) processed.push(result);
    //         currentPos++;
    //     }

    //     // more tasks are left, we might need more idleCallbacks
    //     if (currentPos < totalTasks) {
    //         return window.requestIdleCallback(function(deadline) {worker(deadline);});
    //     }

    //     // tasks are completed
    //     return callback(processed);
    // }

    // window.requestIdleCallback(function(deadline) {worker(deadline);});
}

// shim
window.requestIdleCallback =
    window.requestIdleCallback ||
    function(cb) {
        var start = Date.now();
        return window.setTimeout(function() {
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
        window.clearTimeout(id);
    };
