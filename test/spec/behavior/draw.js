import { select as d3_select } from 'd3-selection';

describe('iD.behaviorDraw', function() {
    var context, container, behavior, surfaceNode;

    function dispatch(type, target, props) {
        target.dispatchEvent(new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: jsdom.window,
            ...props
        }));
    }

    beforeEach(function() {
        container = d3_select('body').append('div');
        context = iD.coreContext().assetPath('../dist/').init().container(container);

        container
            .append('div')
            .attr('class', 'main-map')
            .call(context.map());

        context.enter(iD.modeBrowse(context));

        behavior = iD.behaviorDraw(context);
        context.install(behavior);

        surfaceNode = context.surface().node();
    });

    afterEach(function() {
        context.uninstall(behavior);
        context.mode().exit();
        container.remove();
    });

    it('places the first point at the pointer position when the surface is mid-transform', function() {
        var locs = [];
        behavior.on('click', function(loc) { locs.push(loc); });

        // While zooming or panning, iD applies a CSS transform to `.supersurface`,
        // which offsets the bounding rect of the `.surface` element inside it. - #12889
        surfaceNode.getBoundingClientRect = function() {
            return {
                left: -120, top: -80, right: 280, bottom: 220,
                width: 400, height: 300, x: -120, y: -80
            };
        };

        var clientX = 400;
        var clientY = 300;

        dispatch('mousedown', surfaceNode, { clientX: clientX, clientY: clientY });
        dispatch('mouseup', surfaceNode, { clientX: clientX, clientY: clientY });

        var expected = context.projection.invert([clientX, clientY]);
        expect(locs.length).toEqual(1);
        expect(locs[0][0]).toBeCloseTo(expected[0], 6);
        expect(locs[0][1]).toBeCloseTo(expected[1], 6);
    });
});
