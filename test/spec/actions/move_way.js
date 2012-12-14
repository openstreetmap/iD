describe("iD.actions.MoveWay", function () {
    it("moves all nodes in a way by the given amount", function () {
        var node1  = iD.Node({loc: [0, 0]}),
            node2  = iD.Node({loc: [5, 10]}),
            way    = iD.Way({nodes: [node1.id, node2.id]}),
            dxdy   = [2, 3],
            projection = d3.geo.mercator(),
            graph  = iD.actions.MoveWay(way.id, dxdy, projection)(iD.Graph([node1, node2, way]));
        expect(graph.entity(node1.id).loc).to.eql([1.4400000000000002, -2.1594885414215783]);
        expect(graph.entity(node2.id).loc).to.eql([6.440000000000008, 7.866329874099955]);
    });

    it("moves repeated nodes only once", function () {
        var node   = iD.Node({loc: [0, 0]}),
            way    = iD.Way({nodes: [node.id, node.id]}),
            dxdy   = [2, 3],
            projection = d3.geo.mercator(),
            graph  = iD.actions.MoveWay(way.id, dxdy, projection)(iD.Graph([node, way]));
        expect(graph.entity(node.id).loc).to.eql([1.4400000000000002, -2.1594885414215783]);
    });
});
