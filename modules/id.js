import 'browser-polyfills';
import 'string.fromcodepoint/auto';
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch';

// polyfill requestIdleCallback
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
