describe('iD.modeAddNote', function() {
    var context;

    before(function() {
        iD.services.osm = iD.serviceOsm;
    });

    after(function() {
        delete iD.services.osm;
    });

    beforeEach(function() {
        var container = d3.select(document.createElement('div'));
        context = iD.coreContext()
            .container(container)
            .init();

        context.loadTiles = function () {};

        container.call(context.map())
            .append('div')
            .attr('class', 'inspector-wrap');

        context.map().centerZoom([-77.02271, 38.90085], 20);
        context.enter(iD.modeAddNote(context));
    });

    describe('clicking the map', function () {
        it('adds a note', function() {
            var note =  iD.osmNote({
                id: '-1',
                comments: [],
                loc: [-77.02271, 38.90085],
                status: 'open'
            });
            happen.mousedown(context.surface().node(), {});
            happen.mouseup(window, {});
            expect(iD.services.osm.caches().note.note[-1]).to.eql(note);
            context.mode().exit();
            d3.select('window').on('click.draw-block', null);
        });

        // this won't work because draw behavior can only snap to entities, not notes
        // it('selects an existing note rather than adding a new one', function() {
        //     happen.mousedown(context.surface().node(), {});
        //     happen.mouseup(window, {});
        //     expect(context.selectedNoteID()).to.eql(-1);
        //     expect(context.mode().id).to.equal('select-note');
        //     context.mode().exit();
        //     d3.select('window').on('click.draw-block', null);
        // });
    });

    // describe('pressing ⎋', function() {
    //     it('exits to browse mode', function(done) {
    //         happen.keydown(document, {keyCode: 27});
    //         window.setTimeout(function() {
    //             expect(context.mode().id).to.equal('browse');
    //             done();
    //         }, 200);
    //     });
    // });
});
