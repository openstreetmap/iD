import { describe, it, expect, beforeEach, afterEach } from 'vitest';


// ============================================================================
// Unit tests for the three-tier label text measurement chain in
// modules/svg/labels.js (`textWidth`):
//
//   1. offscreen canvas 2D context (`measureText`)
//   2. detached SVG <text> element (`getComputedTextLength`)
//   3. SVG <text> attached to the caller's container (`getComputedTextLength`)
//
// jsdom quirks that shape this spec:
//  * jsdom has no canvas implementation — `canvas.getContext('2d')` returns
//    null (the optional `canvas` npm package is not installed). We stub
//    `HTMLCanvasElement.prototype.getContext` with a scriptable fake 2D
//    context whose `measureText` returns widths we control.
//  * jsdom does not implement `SVGTextElement.getComputedTextLength` (it is
//    undefined), so both SVG tiers would throw on it. We stub the prototype
//    method and serve scriptable widths.
//  * jsdom's `getComputedStyle(document.body).fontFamily` returns the literal
//    string 'depends on user agent' (non-empty, but no real font), so the
//    body-font gate in textWidth is satisfied by default; the stub is switched
//    to '' to exercise the "no body font" fallback tier.
//  * labels.js captures its body font lazily on the first textWidth() call and
//    keeps a module-scope width cache, so each test imports a fresh module
//    instance with the stubs installed first — otherwise the first test would
//    freeze in one font/cache for the rest. `vi.resetModules()` is not usable
//    here: re-evaluating the whole labels.js dependency graph from a different
//    entry point trips an ESM class-inheritance cycle in modules/osm, so
//    instead each test imports a unique query-suffixed URL
//    (labels.js?fresh=N), which vite keys as a separate module whose
//    dependencies are the already-evaluated originals.
// ============================================================================

var textWidth;
var _freshId = 0;         // per-test import counter (see note above)
var fakeCtx;              // scriptable fake 2D canvas context
var measureTextCalls;     // count of measureText() calls on the fake context
var computedLengths;      // queue of widths served by the getComputedTextLength stub
var computedLengthCalls;  // count of getComputedTextLength() calls
var lastMeasuredParent;   // parent of the SVG element measured (null = detached)
var bodyFont;             // fontFamily the getComputedStyle stub reports

// jsdom does not expose a global `SVGTextElement` constructor (its SVG <text>
// elements are plain SVGElement instances), so reach the prototype through a
// created element instead.
var _svgTextProto = Object.getPrototypeOf(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
var _origGetContext = HTMLCanvasElement.prototype.getContext;
var _origGetComputedStyle = window.getComputedStyle;

beforeEach(async function() {
    measureTextCalls = 0;
    computedLengths = [];
    computedLengthCalls = 0;
    lastMeasuredParent = undefined;
    bodyFont = 'test-font';

    fakeCtx = {
        font: undefined,
        width: 0,
        measureText: function() {
            measureTextCalls++;
            return { width: fakeCtx.width };
        }
    };
    HTMLCanvasElement.prototype.getContext = function() { return fakeCtx; };
    _svgTextProto.getComputedTextLength = function() {
        computedLengthCalls++;
        lastMeasuredParent = this.parentNode;
        return computedLengths.shift() || 0;
    };
    window.getComputedStyle = function() { return { fontFamily: bodyFont }; };

    // Fresh module instance: empty width cache, no captured body font, and
    // the canvas context captured from the stubbed getContext above.
    ({ textWidth } = await import('../../../modules/svg/labels.js?fresh=' + _freshId++));
});

afterEach(function() {
    HTMLCanvasElement.prototype.getContext = _origGetContext;
    delete _svgTextProto.getComputedTextLength;   // restore: jsdom has no such method
    window.getComputedStyle = _origGetComputedStyle;
});


describe('iD.svgLabels textWidth measurement tiers', function() {
    it('measures on the offscreen canvas without falling back', function() {
        fakeCtx.width = 42;
        expect(textWidth('hello', 12, document.body)).toBe(42);
        expect(measureTextCalls).toBe(1);      // canvas tier only
        expect(computedLengthCalls).toBe(0);   // no SVG fallback
        expect(fakeCtx.font).toBe('bold 12px test-font');  // lazy body-font capture
    });

    it('falls back to the detached SVG tier when the canvas measures 0 for non-empty text', function() {
        fakeCtx.width = 0;
        computedLengths.push(17);
        expect(textWidth('world', 12, document.body)).toBe(17);
        expect(measureTextCalls).toBe(1);      // canvas consulted, came back 0
        expect(computedLengthCalls).toBe(1);   // detached tier served the width
        expect(lastMeasuredParent).toBe(null); // detached element is never attached
    });

    it('keeps width 0 for empty text without falling back', function() {
        fakeCtx.width = 0;
        computedLengths.push(99);
        expect(textWidth('', 12, document.body)).toBe(0);
        expect(measureTextCalls).toBe(1);
        expect(computedLengthCalls).toBe(0);   // empty text does not fall back
    });

    it('falls back to measuring attached when the body font is missing', function() {
        bodyFont = '';
        fakeCtx.width = 42;                    // must not be consulted
        computedLengths.push(23);
        expect(textWidth('attached', 12, document.body)).toBe(23);
        expect(measureTextCalls).toBe(0);      // canvas skipped (no body font)
        expect(computedLengthCalls).toBe(1);   // attached tier served the width
        expect(lastMeasuredParent).toBe(document.body);  // was attached, then removed
    });

    it('shares one cached width across measurement tiers', function() {
        fakeCtx.width = 42;
        expect(textWidth('mixed', 12, document.body)).toBe(42);  // canvas tier
        expect(measureTextCalls).toBe(1);

        // The next read of the same (size, text) would land on a different
        // tier (canvas now 0, detached would report 99), but the shared cache
        // serves the width measured by the first tier.
        fakeCtx.width = 0;
        computedLengths.push(99);
        expect(textWidth('mixed', 12, document.body)).toBe(42);
        expect(measureTextCalls).toBe(1);      // cache hit: no re-measure
        expect(computedLengthCalls).toBe(0);   // no SVG tier consulted
    });
});
