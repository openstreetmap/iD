describe('iD.actionDeleteNode', function () {
    it('removes the node from the graph', function () {
        var node   = iD.osmNode(),
            action = iD.actionDeleteNode(node.id),
            graph  = action(iD.coreGraph([node]));
        expect(graph.hasEntity(node.id)).to.be.undefined;
    });

    it('removes the node from parent ways', function () {
        var node1  = iD.osmNode(),
            node2  = iD.osmNode(),
            node3  = iD.osmNode(),
            way    = iD.osmWay({nodes: [node1.id, node2.id, node3.id]}),
            action = iD.actionDeleteNode(node1.id),
            graph  = action(iD.coreGraph([node1, node2, node3, way]));
        expect(graph.entity(way.id).nodes).to.eql([node2.id, node3.id]);
    });

    it('removes the node from parent relations', function () {
        var node1    = iD.osmNode(),
            node2    = iD.osmNode(),
            relation = iD.osmRelation({members: [{ id: node1.id }, { id: node2.id }]}),
            action   = iD.actionDeleteNode(node1.id),
            graph    = action(iD.coreGraph([node1, node2, relation]));
        expect(graph.entity(relation.id).members).to.eql([{ id: node2.id }]);
    });

    it('deletes parent ways that would otherwise have less than two nodes', function () {
        var node1  = iD.osmNode(),
            node2  = iD.osmNode(),
            way    = iD.osmWay({nodes: [node1.id, node2.id]}),
            action = iD.actionDeleteNode(node1.id),
            graph  = action(iD.coreGraph([node1, node2, way]));
        expect(graph.hasEntity(way.id)).to.be.undefined;
    });

    it('deletes degenerate circular ways', function () {
        var node1  = iD.osmNode(),
            node2  = iD.osmNode(),
            way    = iD.osmWay({nodes: [node1.id, node2.id, node1.id]}),
            action = iD.actionDeleteNode(node2.id),
            graph  = action(iD.coreGraph([node1, node2, way]));
        expect(graph.hasEntity(way.id)).to.be.undefined;
    });

    it('deletes parent relations that become empty', function () {
        var node1    = iD.osmNode(),
            relation = iD.osmRelation({members: [{ id: node1.id }]}),
            action   = iD.actionDeleteNode(node1.id),
            graph    = action(iD.coreGraph([node1, relation]));
        expect(graph.hasEntity(relation.id)).to.be.undefined;
    });
});
