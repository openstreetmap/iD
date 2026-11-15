import { select as d3_select } from 'd3-selection';

describe.skip('iD.modeAddPoint', function() {
    var context;

    beforeEach(function() {
        var container = d3_select(document.createElement('div'));
        context = iD.coreContext().assetPath('../dist/').container(container).init();
        context.loadTiles = function () {};

        container.call(context.map())
            .append('div')
            .attr('class', 'inspector-wrap');

        context.map().centerZoom([-77.02271, 38.90085], 20);
        context.enter(iD.modeAddPoint(context));
    });

    describe('clicking the map', function () {
        it('adds a point', function() {
            context.surface().node().dispatchEvent(new MouseEvent('mousedown'));
            window.dispatchEvent(new MouseEvent('mouseup'));
            expect(context.history().changes().created).toHaveLength(1);
            context.mode().exit();
            d3_select('window').on('click.draw-block', null);
        });

        it('selects an existing point rather than adding a new one', function() {
            context.surface().node().dispatchEvent(new MouseEvent('mousedown'));
            window.dispatchEvent(new MouseEvent('mouseup'));
            expect(context.mode().id).to.equal('select');
            expect(context.mode().selectedIDs()).toEqual([context.history().changes().created[0].id]);
            context.mode().exit();
        });
    });

    // describe('pressing ⎋', function() {
    //     it.skip('exits to browse mode', function(done) {
    //         document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 27 }));
    //         window.setTimeout(function() {
    //             expect(context.mode().id).toEqual('browse');
    //             done();
    //         }, 200);
    //     });
    // });
});
