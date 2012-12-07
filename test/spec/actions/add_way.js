describe("iD.actions.AddWay", function () {
    it("adds a way to the graph", function () {
        var way = iD.Way(),
            graph = iD.actions.AddWay(way)(iD.Graph());
        expect(graph.entity(way.id)).to.equal(way);
    });
});
