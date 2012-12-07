describe("iD.actions.Noop", function () {
    it("does nothing", function () {
        var graph = iD.Graph(),
            action = iD.actions.Noop(graph);
        expect(action(graph)).to.equal(graph);
    });
});
