describe("iD.actions.AddWayNode", function () {
    it("adds a node to the end of a way", function () {
        var way = iD.Way(),
            node = iD.Node({id: "n1"}),
            graph = iD.actions.AddWayNode(way.id, node.id)(iD.Graph([way, node]));
        expect(graph.entity(way.id).nodes).to.eql(["n1"]);
    });

    it("adds a node to a way at index 0", function () {
        var way = iD.Way({nodes: ["n1", "n3"]}),
            node = iD.Node({id: "n2"}),
            graph = iD.actions.AddWayNode(way.id, node.id, 0)(iD.Graph([way, node]));
        expect(graph.entity(way.id).nodes).to.eql(["n2", "n1", "n3"]);
    });

    it("adds a node to a way at a positive index", function () {
        var way = iD.Way({nodes: ["n1", "n3"]}),
            node = iD.Node({id: "n2"}),
            graph = iD.actions.AddWayNode(way.id, node.id, 1)(iD.Graph([way, node]));
        expect(graph.entity(way.id).nodes).to.eql(["n1", "n2", "n3"]);
    });

    it("adds a node to a way at a negative index", function () {
        var way = iD.Way({nodes: ["n1", "n3"]}),
            node = iD.Node({id: "n2"}),
            graph = iD.actions.AddWayNode(way.id, node.id, -1)(iD.Graph([way, node]));
        expect(graph.entity(way.id).nodes).to.eql(["n1", "n2", "n3"]);
    });
});
