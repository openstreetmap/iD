describe("iD.modes.AddPoint", function () {
    var container, map, history, controller, mode;

    beforeEach(function () {
        container  = d3.select('body').append('div');
        history    = iD.History();
        var connection = iD.Connection();
        map        = iD.Map().history(history).connection(connection);
        controller = iD.Controller(map, history);

        container.call(map);
        container.append('div')
            .attr('class', 'inspector-wrap');

        mode = iD.modes.AddPoint();
        controller.enter(mode);
    });

    afterEach(function() {
        container.remove();
    });

    describe("clicking the map", function () {
        it("adds a node", function () {
            happen.click(map.surface.node(), {});
            expect(history.changes().created).to.have.length(1);
        });

        it("selects the node", function () {
            happen.click(map.surface.node(), {});
            expect(controller.mode.id).to.equal('select');
            expect(controller.mode.selection()).to.eql([history.changes().created[0].id]);
        });
    });

    describe("pressing ⎋", function () {
        it("exits to browse mode", function () {
            happen.keydown(document, {keyCode: 27});
            expect(controller.mode.id).to.equal('browse');
        });
    });
});
