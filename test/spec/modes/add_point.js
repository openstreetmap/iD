describe("iD.modes.AddPoint", function () {
    var context;

    beforeEach(function () {
        var container = d3.select(document.createElement('div'));

        context = iD.Context()
            .container(container);

        container.call(context.map())
            .append('div')
            .attr('class', 'inspector-wrap');

        context.enter(iD.modes.AddPoint(context));
    });

    describe("clicking the map", function () {
        it("adds a node", function () {
            happen.click(context.surface().node(), {});
            expect(context.changes().created).to.have.length(1);
        });

        it("selects the node", function () {
            happen.click(context.surface().node(), {});
            expect(context.mode().id).to.equal('select');
            expect(context.mode().selection()).to.eql([context.changes().created[0].id]);
        });
    });

    describe("pressing ⎋", function () {
        it("exits to browse mode", function () {
            happen.keydown(document, {keyCode: 27});
            expect(context.mode().id).to.equal('browse');
        });
    });
});
