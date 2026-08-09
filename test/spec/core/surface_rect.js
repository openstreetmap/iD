import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { select as d3_select } from 'd3-selection';


// jsdom has no requestAnimationFrame; install a controllable stub so the
// same-frame cache bound in context.surfaceRect() can be exercised.
let _rAFQueue = [];
const _origRAF = window.requestAnimationFrame;

function runNextRAF() {
    const cb = _rAFQueue.shift();
    if (cb) cb(performance.now());
}

function rect(width, height) {
    return {
        x: 0, y: 0, top: 0, left: 0,
        width, height,
        right: width, bottom: height,
        toJSON() { return {}; }
    };
}


describe('iD.coreContext surfaceRect cache', function() {
    var content, context, map, surfaceNode, measureCount;

    beforeEach(function() {
        _rAFQueue = [];
        window.requestAnimationFrame = function(cb) {
            _rAFQueue.push(cb);
            return _rAFQueue.length;
        };

        content = d3_select('body').append('div');
        context = iD.coreContext().assetPath('../dist/').init().container(content);
        map = context.map();
        content.call(map);
        map.dimensions([1000, 1000]);

        surfaceNode = context.surface().node();
        measureCount = 0;
        surfaceNode.getBoundingClientRect = function() {
            measureCount++;
            return rect(1000, 1000);
        };
    });

    afterEach(function() {
        content.remove();
        window.requestAnimationFrame = _origRAF;
    });

    it('caches the rect for the current animation frame', function() {
        var r1 = context.surfaceRect();
        var r2 = context.surfaceRect();
        expect(r1).toBe(r2);            // same cached object
        expect(measureCount).toBe(1);   // measured only once
    });

    it('returns the new rect to a reader in the same frame as a resize', function() {
        var before = context.surfaceRect();
        expect(before.width).toBe(1000);
        expect(measureCount).toBe(1);

        // Simulate the synchronous resize chain: window resize / sidebar
        // toggle -> ui.onResize -> map.dimensions -> scheduleRedraw, with
        // the surfaceRect read (e.g. edit menu on 'drawn') landing before
        // any animation frame has run.
        surfaceNode.getBoundingClientRect = function() {
            measureCount++;
            return rect(700, 500);
        };
        map.dimensions([700, 500]);

        var after = context.surfaceRect();
        expect(after.width).toBe(700);
        expect(after.height).toBe(500);

        // Repeated reads in the same frame still reuse the cache.
        expect(context.surfaceRect()).toBe(after);
        expect(measureCount).toBe(2);
    });

    it('resets the same-frame bound on the next animation frame', function() {
        context.surfaceRect();
        expect(measureCount).toBe(1);
        expect(_rAFQueue.length).toBe(1);

        // The frame boundary passes without a resize: cache is dropped.
        runNextRAF();
        surfaceNode.getBoundingClientRect = function() {
            measureCount++;
            return rect(900, 900);
        };
        var r2 = context.surfaceRect();
        expect(r2.width).toBe(900);
        expect(measureCount).toBe(2);
    });

    it('does not let a stale rAF callback re-enable measurement early', function() {
        context.surfaceRect();                       // measure (1), schedules R1
        expect(measureCount).toBe(1);

        surfaceNode.getBoundingClientRect = function() {
            measureCount++;
            return rect(600, 400);
        };
        map.dimensions([600, 400]);                  // invalidates the cache
        context.surfaceRect();                       // re-measures (2), schedules R2
        expect(measureCount).toBe(2);

        // R1 (scheduled before the resize) fires first: with the stale-frame
        // guard it must not drop the cache, so a read still reuses rect 2.
        runNextRAF();
        var cached = context.surfaceRect();
        expect(cached.width).toBe(600);
        expect(measureCount).toBe(2);

        // R2 (the current frame) fires: bound resets for the next frame.
        runNextRAF();
        context.surfaceRect();
        expect(measureCount).toBe(3);
    });
});
