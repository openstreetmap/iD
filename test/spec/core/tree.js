describe('iD.coreTree', function() {
    describe('#rebase', function() {
        it('adds entities to the tree', function() {
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                node = iD.osmNode({id: 'n', loc: [1, 1]});

            graph.rebase([node], [graph]);
            tree.rebase([node]);

            expect(tree.intersects(iD.geoExtent([0, 0], [2, 2]), graph)).to.eql([node]);
        });

        it('is idempotent', function() {
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                node = iD.osmNode({id: 'n', loc: [1, 1]}),
                extent = iD.geoExtent([0, 0], [2, 2]);

            graph.rebase([node], [graph]);
            tree.rebase([node]);
            expect(tree.intersects(extent, graph)).to.eql([node]);

            graph.rebase([node], [graph]);
            tree.rebase([node]);
            expect(tree.intersects(extent, graph)).to.eql([node]);
        });

        it('does not insert if entity has a modified version', function() {
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                node = iD.osmNode({id: 'n', loc: [1, 1]}),
                node_ = node.update({loc: [10, 10]}),
                g = graph.replace(node_);

            expect(tree.intersects(iD.geoExtent([9, 9], [11, 11]), g)).to.eql([node_]);

            graph.rebase([node], [graph]);
            tree.rebase([node]);

            expect(tree.intersects(iD.geoExtent([0, 0], [2, 2]), g)).to.eql([]);
            expect(tree.intersects(iD.geoExtent([0, 0], [11, 11]), g)).to.eql([node_]);
        });

        it('does not error on self-referencing relations', function() {
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                node = iD.osmNode({id: 'n', loc: [1, 1]}),
                relation = iD.osmRelation();

            relation = relation.addMember({id: node.id});
            relation = relation.addMember({id: relation.id});

            graph.rebase([node, relation], [graph]);
            tree.rebase([relation]);

            expect(tree.intersects(iD.geoExtent([0, 0], [2, 2]), graph)).to.eql([relation]);
        });

        it('adjusts entities that are force-rebased', function() {
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                node = iD.osmNode({id: 'n', loc: [1, 1]});

            graph.rebase([node], [graph]);
            tree.rebase([node]);

            node = node.move([-1, -1]);
            graph.rebase([node], [graph], true);
            tree.rebase([node], true);

            expect(tree.intersects(iD.geoExtent([0, 0], [2, 2]), graph)).to.eql([]);
        });
    });

    describe('#intersects', function() {
        it('includes entities within extent, excludes those without', function() {
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                n1 = iD.osmNode({loc: [1, 1]}),
                n2 = iD.osmNode({loc: [3, 3]}),
                extent = iD.geoExtent([0, 0], [2, 2]);

            graph = graph.replace(n1).replace(n2);
            expect(tree.intersects(extent, graph)).to.eql([n1]);
        });

        it('includes intersecting relations after incomplete members are loaded', function() {
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                n1 = iD.osmNode({id: 'n1', loc: [0, 0]}),
                n2 = iD.osmNode({id: 'n2', loc: [1, 1]}),
                relation = iD.osmRelation({id: 'r', members: [{id: 'n1'}, {id: 'n2'}]}),
                extent = iD.geoExtent([0.5, 0.5], [1.5, 1.5]);

            graph.rebase([relation, n1], [graph]);
            tree.rebase([relation, n1]);
            expect(tree.intersects(extent, graph)).to.eql([]);

            graph.rebase([n2], [graph]);
            tree.rebase([n2]);
            expect(tree.intersects(extent, graph)).to.eql([n2, relation]);
        });

        // This happens when local storage includes a changed way but not its nodes.
        it('includes intersecting ways after missing nodes are loaded', function() {
            var base = iD.coreGraph(),
                tree = iD.coreTree(base),
                node = iD.osmNode({id: 'n', loc: [0.5, 0.5]}),
                way = iD.osmWay({nodes: ['n']}),
                graph = base.replace(way),
                extent = iD.geoExtent([0, 0], [1, 1]);

            expect(tree.intersects(extent, graph)).to.eql([]);

            base.rebase([node], [base, graph]);
            tree.rebase([node]);
            expect(tree.intersects(extent, graph)).to.eql([node, way]);
        });

        it('adjusts parent ways when a member node is moved', function() {
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                node = iD.osmNode({id: 'n', loc: [1, 1]}),
                way = iD.osmWay({nodes: ['n']}),
                extent = iD.geoExtent([0, 0], [2, 2]);

            graph = graph.replace(node).replace(way);
            expect(tree.intersects(extent, graph)).to.eql([node, way]);

            graph = graph.replace(node.move([3, 3]));
            expect(tree.intersects(extent, graph)).to.eql([]);
        });

        it('adjusts parent relations when a member node is moved', function() {
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                node = iD.osmNode({id: 'n', loc: [1, 1]}),
                relation = iD.osmRelation({members: [{type: 'node', id: 'n'}]}),
                extent = iD.geoExtent([0, 0], [2, 2]);

            graph = graph.replace(node).replace(relation);
            expect(tree.intersects(extent, graph)).to.eql([node, relation]);

            graph = graph.replace(node.move([3, 3]));
            expect(tree.intersects(extent, graph)).to.eql([]);
        });

        it('adjusts parent relations of parent ways when a member node is moved', function() {
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                node = iD.osmNode({id: 'n', loc: [1, 1]}),
                way = iD.osmWay({id: 'w', nodes: ['n']}),
                relation = iD.osmRelation({members: [{type: 'multipolygon', id: 'w'}]}),
                extent = iD.geoExtent([0, 0], [2, 2]);

            graph = graph.replace(node).replace(way).replace(relation);
            expect(tree.intersects(extent, graph)).to.eql([node, way, relation]);

            graph = graph.replace(node.move([3, 3]));
            expect(tree.intersects(extent, graph)).to.eql([]);
        });

        it('adjusts parent ways when a member node is removed', function() {
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                n1 = iD.osmNode({id: 'n1', loc: [1, 1]}),
                n2 = iD.osmNode({id: 'n2', loc: [3, 3]}),
                way = iD.osmWay({nodes: ['n1', 'n2']}),
                extent = iD.geoExtent([0, 0], [2, 2]);

            graph = graph.replace(n1).replace(n2).replace(way);
            expect(tree.intersects(extent, graph)).to.eql([n1, way]);

            graph = graph.replace(way.removeNode('n1'));
            expect(tree.intersects(extent, graph)).to.eql([n1]);
        });

        it('don\'t include parent way multiple times when multiple child nodes are moved', function() {
            // checks against the following regression: https://github.com/openstreetmap/iD/issues/1978
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                n1 = iD.osmNode({id: 'n1', loc: [1, 1]}),
                n2 = iD.osmNode({id: 'n2', loc: [3, 3]}),
                way = iD.osmWay({id: 'w1', nodes: ['n1', 'n2']}),
                extent = iD.geoExtent([0, 0], [4, 4]);

            graph = graph.replace(n1).replace(n2).replace(way);
            expect(tree.intersects(extent, graph)).to.eql([n1, n2, way]);

            graph = graph.replace(n1.move([1.1,1.1])).replace(n2.move([2.1,2.1]));
            var intersects = tree.intersects(extent, graph).map(function(e) { return e.id; });
            expect(intersects).to.have.same.members(['n1','n2','w1']);
        });

        it('doesn\'t include removed entities', function() {
            var graph = iD.coreGraph(),
                tree = iD.coreTree(graph),
                node = iD.osmNode({loc: [1, 1]}),
                extent = iD.geoExtent([0, 0], [2, 2]);

            graph = graph.replace(node);
            expect(tree.intersects(extent, graph)).to.eql([node]);

            graph = graph.remove(node);
            expect(tree.intersects(extent, graph)).to.eql([]);
        });

        it('doesn\'t include removed entities after rebase', function() {
            var base = iD.coreGraph(),
                tree = iD.coreTree(base),
                node = iD.osmNode({id: 'n', loc: [1, 1]}),
                extent = iD.geoExtent([0, 0], [2, 2]);

            var graph = base.replace(node).remove(node);
            expect(tree.intersects(extent, graph)).to.eql([]);

            base.rebase([node], [base]);
            tree.rebase([node]);
            expect(tree.intersects(extent, graph)).to.eql([]);
        });

        it('handles recursive relations', function() {
            var base = iD.coreGraph(),
                tree = iD.coreTree(base),
                node = iD.osmNode({id: 'n', loc: [1, 1]}),
                r1   = iD.osmRelation({id: 'r1', members: [{id: 'n'}]}),
                r2   = iD.osmRelation({id: 'r2', members: [{id: 'r1'}]}),
                extent = iD.geoExtent([0, 0], [2, 2]);

            var graph = base.replace(r1).replace(r2);
            expect(tree.intersects(extent, graph)).to.eql([]);

            base.rebase([node], [base, graph]);
            tree.rebase([node]);
            expect(tree.intersects(extent, graph)).to.eql([node, r1, r2]);
        });
    });
});
