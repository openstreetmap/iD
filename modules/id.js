// polyfill window.fetch and AbortController (not included in core-js)
import 'whatwg-fetch';
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch';

// polyfill idle callback functions (not included in core-js)
window.requestIdleCallback = window.requestIdleCallback ||
    function(cb) {
        var start = Date.now();
        return window.requestAnimationFrame(function() {
            cb({
                didTimeout: false,
                timeRemaining: function() {
                    return Math.max(0, 50 - (Date.now() - start));
                }
            });
        });
    };
window.cancelIdleCallback = window.cancelIdleCallback ||
    function(id) {
        window.cancelAnimationFrame(id);
    };


import * as iD from './index';
window.iD = iD;
