import { select as d3_select } from 'd3-selection';
import { utilZoomPan } from '../../../modules/util/zoom_pan';

function createPointerEvent(type, props) {
    var event = new MouseEvent(type, props);
    if (props && props.pointerId !== undefined) {
        event.pointerId = props.pointerId;
    }
    if (props && props.pointerType !== undefined) {
        event.pointerType = props.pointerType;
    }
    return event;
}

describe('utilZoomPan', function () {
    var element;
    var zoom;

    beforeEach(function () {
        d3_select('body').selectAll('.zoompan-test').remove();
        element = d3_select('body')
            .append('div')
            .attr('class', 'zoompan-test')
            .style('width', '500px')
            .style('height', '500px');
        zoom = utilZoomPan();
        element.call(zoom);
    });

    afterEach(function () {
        element.remove();
    });

    it('initializes with default identity transform', function () {
        expect(zoom._transform().k).toBe(1);
        expect(zoom._transform().x).toBe(0);
        expect(zoom._transform().y).toBe(0);
    });

    it('pans with a single pointer', function () {
        var node = element.node();
        var started = false;
        var zoomed = false;
        var ended = false;

        zoom.on('start', function () { started = true; });
        zoom.on('zoom', function () { zoomed = true; });
        zoom.on('end', function () { ended = true; });

        node.dispatchEvent(createPointerEvent('pointerdown', {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 100,
            clientY: 100,
            bubbles: true
        }));
        expect(started).toBe(true);

        window.dispatchEvent(createPointerEvent('pointermove', {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 150,
            clientY: 120,
            bubbles: true
        }));
        expect(zoomed).toBe(true);
        expect(zoom._transform().x).toBe(50);
        expect(zoom._transform().y).toBe(20);
        expect(zoom._transform().k).toBe(1); // scale remains unchanged during pan

        window.dispatchEvent(createPointerEvent('pointerup', {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 150,
            clientY: 120,
            bubbles: true
        }));
        expect(ended).toBe(true);
    });

    it('pinch-zooms with two pointers and returns cleanly to pan when one pointer is released', function () {
        var node = element.node();

        // Finger 1 down at (100, 100)
        node.dispatchEvent(createPointerEvent('pointerdown', {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 100,
            clientY: 100,
            bubbles: true
        }));

        // Finger 2 down at (200, 100)
        node.dispatchEvent(createPointerEvent('pointerdown', {
            pointerId: 2,
            pointerType: 'touch',
            clientX: 200,
            clientY: 100,
            bubbles: true
        }));

        // Move finger 2 further away to (300, 100) - distance increases from 100 to 200 => scale zooms in (doubles)
        window.dispatchEvent(createPointerEvent('pointermove', {
            pointerId: 2,
            pointerType: 'touch',
            clientX: 300,
            clientY: 100,
            bubbles: true
        }));
        expect(zoom._transform().k).toBeCloseTo(2, 1);

        // Release finger 2
        window.dispatchEvent(createPointerEvent('pointerup', {
            pointerId: 2,
            pointerType: 'touch',
            clientX: 300,
            clientY: 100,
            bubbles: true
        }));

        var kAfterPinch = zoom._transform().k;

        // Move remaining finger 1 from (100, 100) to (120, 100) - must pan, NOT zoom!
        window.dispatchEvent(createPointerEvent('pointermove', {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 120,
            clientY: 100,
            bubbles: true
        }));
        expect(zoom._transform().k).toBe(kAfterPinch); // zoom scale MUST NOT CHANGE

        // Release finger 1
        window.dispatchEvent(createPointerEvent('pointerup', {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 120,
            clientY: 100,
            bubbles: true
        }));
    });

    it('does not get stuck in pinch-zoom if a pointer is cancelled', function () {
        var node = element.node();

        // Finger 1 down
        node.dispatchEvent(createPointerEvent('pointerdown', {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 100,
            clientY: 100,
            bubbles: true
        }));

        // Finger 2 down
        node.dispatchEvent(createPointerEvent('pointerdown', {
            pointerId: 2,
            pointerType: 'touch',
            clientX: 200,
            clientY: 100,
            bubbles: true
        }));

        // Browser cancels finger 2 (e.g. system navigation gesture)
        window.dispatchEvent(createPointerEvent('pointercancel', {
            pointerId: 2,
            pointerType: 'touch',
            clientX: 200,
            clientY: 100,
            bubbles: true
        }));

        // Release finger 1
        window.dispatchEvent(createPointerEvent('pointerup', {
            pointerId: 1,
            pointerType: 'touch',
            clientX: 100,
            clientY: 100,
            bubbles: true
        }));

        var kBeforeNewTouch = zoom._transform().k;

        // Now start a brand new touch gesture with a single finger
        node.dispatchEvent(createPointerEvent('pointerdown', {
            pointerId: 3,
            pointerType: 'touch',
            clientX: 150,
            clientY: 150,
            bubbles: true
        }));

        // Moving to the side must PAN, and must NOT zoom against any phantom pointer!
        window.dispatchEvent(createPointerEvent('pointermove', {
            pointerId: 3,
            pointerType: 'touch',
            clientX: 200,
            clientY: 150,
            bubbles: true
        }));

        expect(zoom._transform().k).toBe(kBeforeNewTouch); // Scale remains exact!

        window.dispatchEvent(createPointerEvent('pointerup', {
            pointerId: 3,
            pointerType: 'touch',
            clientX: 200,
            clientY: 150,
            bubbles: true
        }));
    });
});
