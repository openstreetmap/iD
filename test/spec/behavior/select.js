describe("iD.behavior.Select", function() {
    var a, b, context, behavior, container;

    beforeEach(function() {
        container = d3.select('body').append('div');

        context = iD().container(container);

        a = iD.Node({loc: [0, 0]});
        b = iD.Node({loc: [0, 0]});

        context.perform(iD.actions.AddEntity(a), iD.actions.AddEntity(b));

        container.call(context.map())
            .append('div')
            .attr('class', 'inspector-wrap');

        context.surface().selectAll('circle')
            .data([a, b])
            .enter().append('circle')
            .attr('class', function(d) { return d.id; });

        behavior = iD.behavior.Select(context);
        context.install(behavior);
    });

    afterEach(function() {
        context.uninstall(behavior);
        context.mode().exit();
        container.remove();
    });

    specify("click on entity selects the entity", function(done) {
        happen.mousedown(context.surface().select('.' + a.id).node());
        window.setTimeout(function() {
            expect(context.selection()).to.eql([a.id]);
            done();
        }, 600);
    });

    specify("click on empty space clears the selection", function(done) {
        context.enter(iD.modes.Select(context, [a.id]));
        happen.click(context.surface().node());
        happen.mousedown(context.surface().node());
        window.setTimeout(function() {
            expect(context.selection()).to.eql([]);
            done();
        }, 600);
    });

    specify("shift-click on entity adds the entity to the selection", function(done) {
        context.enter(iD.modes.Select(context, [a.id]));
        happen.mousedown(context.surface().select('.' + b.id).node(), {shiftKey: true});
        window.setTimeout(function() {
            expect(context.selection()).to.eql([a.id, b.id]);
            done();
        }, 600);
    });

    specify("shift-click on empty space leaves the selection unchanged", function() {
        context.enter(iD.modes.Select(context, [a.id]));
        happen.click(context.surface().node(), {shiftKey: true});
        expect(context.selection()).to.eql([a.id]);
    });
});
