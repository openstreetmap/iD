describe("iD.actions.ReverseWay", function () {
    it("reverses the order of nodes in the way", function () {
        var node1 = iD.Node(),
            node2 = iD.Node(),
            way = iD.Way({nodes: [node1.id, node2.id]}),
            graph = iD.actions.ReverseWay(way.id)(iD.Graph([node1, node2, way]));
        expect(graph.entity(way.id).nodes).to.eql([node2.id, node1.id]);
    });
});
