describe("iD.actions.removeWayNode", function () {
    it("removes a node from a way", function () {
        var node = iD.Node({id: "n1"}),
            way = iD.Way({id: "w1", nodes: ["n1"]}),
            graph = iD.actions.removeWayNode(way, node)(iD.Graph({n1: node, w1: way}));
        expect(graph.entity(way.id).nodes).to.eql([]);
    });
});
