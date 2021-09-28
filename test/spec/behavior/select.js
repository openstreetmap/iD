describe('iD.behaviorSelect', function() {
    var a, b, context, behavior, container;

    function simulateClick(el, o) {
        // clicks need to appear wherever the map is
        var mapNode = context.container().select('.main-map').node();
        var rect = mapNode.getBoundingClientRect();
        var click = { clientX: rect.left, clientY: rect.top };
        happen.mousedown(el, Object.assign({}, click, o));
        happen.mouseup(el, Object.assign({}, click, o));
    }

    beforeEach(function() {
        container = d3.select('body').append('div');
        context = iD.coreContext().assetPath('../dist/').init().container(container);

        a = iD.osmNode({loc: [0, 0]});
        b = iD.osmNode({loc: [0, 0]});

        context.perform(iD.actionAddEntity(a), iD.actionAddEntity(b));

        container
            .append('div')
            .attr('class', 'main-map')
            .call(context.map())
            .append('div')
            .attr('class', 'inspector-wrap');

        context.surface().select('.data-layer.osm').selectAll('circle')
            .data([a, b])
            .enter().append('circle')
            .attr('class', function(d) { return d.id; });

        context.enter(iD.modeBrowse(context));

        behavior = iD.behaviorSelect(context);
        context.install(behavior);
    });

    afterEach(function() {
        context.uninstall(behavior);
        context.mode().exit();
        container.remove();
    });

    it('refuses to enter select mode with no ids', function() {
        context.enter(iD.modeSelect(context, []));
        expect(context.mode().id, 'empty array').to.eql('browse');
        context.enter(iD.modeSelect(context, undefined));
        expect(context.mode().id, 'undefined').to.eql('browse');
    });

    it('refuses to enter select mode with nonexistent ids', function() {
        context.enter(iD.modeSelect(context, ['w-1']));
        expect(context.mode().id).to.eql('browse');
    });

    it('click on entity selects the entity', function(done) {
        var el = context.surface().selectAll('.' + a.id).node();
        simulateClick(el, {});
        window.setTimeout(function() {
            expect(context.selectedIDs()).to.eql([a.id]);
            done();
        }, 50);
    });

    it('click on empty space clears the selection', function(done) {
        context.enter(iD.modeSelect(context, [a.id]));
        var el = context.surface().node();
        simulateClick(el, {});
        window.setTimeout(function() {
            expect(context.mode().id).to.eql('browse');
            done();
        }, 50);
    });

    it('shift-click on unselected entity adds it to the selection', function(done) {
        context.enter(iD.modeSelect(context, [a.id]));
        var el = context.surface().selectAll('.' + b.id).node();
        simulateClick(el, { shiftKey: true });
        window.setTimeout(function() {
            expect(context.selectedIDs()).to.eql([a.id, b.id]);
            done();
        }, 50);
    });

    it('shift-click on selected entity removes it from the selection', function(done) {
        context.enter(iD.modeSelect(context, [a.id, b.id]));
        var el = context.surface().selectAll('.' + b.id).node();
        simulateClick(el, { shiftKey: true });
        window.setTimeout(function() {
            expect(context.selectedIDs()).to.eql([a.id]);
            done();
        }, 50);
    });

    it('shift-click on last selected entity clears the selection', function(done) {
        context.enter(iD.modeSelect(context, [a.id]));
        var el = context.surface().selectAll('.' + a.id).node();
        simulateClick(el, { shiftKey: true });
        window.setTimeout(function() {
            expect(context.mode().id).to.eql('browse');
            done();
        }, 50);
    });

    it('shift-click on empty space leaves the selection unchanged', function(done) {
        context.enter(iD.modeSelect(context, [a.id]));
        var el = context.surface().node();
        simulateClick(el, { shiftKey: true });
        window.setTimeout(function() {
            expect(context.selectedIDs()).to.eql([a.id]);
            done();
        }, 50);
    });
});
