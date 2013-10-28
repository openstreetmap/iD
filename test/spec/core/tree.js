describe("iD.Tree", function() {
    describe("#rebase", function() {
        it("adds entities to the tree", function() {
            var graph = iD.Graph(),
                tree = iD.Tree(graph),
                node = iD.Node({id: 'n', loc: [1, 1]});

            graph.rebase({n: node});
            tree.rebase([node]);

            expect(tree.intersects(iD.geo.Extent([0, 0], [2, 2]), graph)).to.eql([node]);
        });

        it("is idempotent", function() {
            var graph = iD.Graph(),
                tree = iD.Tree(graph),
                node = iD.Node({id: 'n', loc: [1, 1]}),
                extent = iD.geo.Extent([0, 0], [2, 2]);

            graph.rebase({n: node});
            tree.rebase([node]);
            expect(tree.intersects(extent, graph)).to.eql([node]);

            graph.rebase({n: node});
            tree.rebase([node]);
            expect(tree.intersects(extent, graph)).to.eql([node]);
        });

        it("does not insert if entity has a modified version", function() {
            var graph = iD.Graph(),
                tree = iD.Tree(graph),
                node = iD.Node({id: 'n', loc: [1, 1]}),
                node_ = node.update({loc: [10, 10]}),
                g = graph.replace(node_);

            expect(tree.intersects(iD.geo.Extent([9, 9], [11, 11]), g)).to.eql([node_]);

            graph.rebase({n: node});
            tree.rebase([node]);

            expect(tree.intersects(iD.geo.Extent([0, 0], [2, 2]), g)).to.eql([]);
            expect(tree.intersects(iD.geo.Extent([0, 0], [11, 11]), g)).to.eql([node_]);
        });
    });

    describe("#intersects", function() {
        it("includes entities within extent, excludes those without", function() {
            var graph = iD.Graph(),
                tree = iD.Tree(graph),
                n1 = iD.Node({loc: [1, 1]}),
                n2 = iD.Node({loc: [3, 3]}),
                extent = iD.geo.Extent([0, 0], [2, 2]);

            graph = graph.replace(n1).replace(n2);
            expect(tree.intersects(extent, graph)).to.eql([n1]);
        });

        it("includes intersecting ways after missing nodes are loaded", function() {
            var base = iD.Graph(),
                tree = iD.Tree(base),
                node = iD.Node({id: 'n', loc: [0.5, 0.5]}),
                way = iD.Way({nodes: ['n']}),
                graph = base.replace(way),
                extent = iD.geo.Extent([0, 0], [1, 1]);

            expect(tree.intersects(extent, graph)).to.eql([]);

            base.rebase({n: node});
            tree.rebase([node]);
            expect(tree.intersects(extent, graph)).to.eql([node, way]);
        });

        it("adjusts parent ways when a member node is moved", function() {
            var graph = iD.Graph(),
                tree = iD.Tree(graph),
                node = iD.Node({id: 'n', loc: [1, 1]}),
                way = iD.Way({nodes: ['n']}),
                extent = iD.geo.Extent([0, 0], [2, 2]);

            graph = graph.replace(node).replace(way);
            expect(tree.intersects(extent, graph)).to.eql([node, way]);

            graph = graph.replace(node.move([3, 3]));
            expect(tree.intersects(extent, graph)).to.eql([]);
        });

        it("adjusts parent ways when a member node is removed", function() {
            var graph = iD.Graph(),
                tree = iD.Tree(graph),
                n1 = iD.Node({id: 'n1', loc: [1, 1]}),
                n2 = iD.Node({id: 'n2', loc: [3, 3]}),
                way = iD.Way({nodes: ['n1', 'n2']}),
                extent = iD.geo.Extent([0, 0], [2, 2]);

            graph = graph.replace(n1).replace(n2).replace(way);
            expect(tree.intersects(extent, graph)).to.eql([n1, way]);

            graph = graph.replace(way.removeNode('n1'));
            expect(tree.intersects(extent, graph)).to.eql([n1]);
        });

        it("doesn't include removed entities", function() {
            var graph = iD.Graph(),
                tree = iD.Tree(graph),
                node = iD.Node({loc: [1, 1]}),
                extent = iD.geo.Extent([0, 0], [2, 2]);

            graph = graph.replace(node);
            expect(tree.intersects(extent, graph)).to.eql([node]);

            graph = graph.remove(node);
            expect(tree.intersects(extent, graph)).to.eql([]);
        });

        it("doesn't include removed entities after rebase", function() {
            var base = iD.Graph(),
                tree = iD.Tree(base),
                node = iD.Node({id: 'n', loc: [1, 1]}),
                extent = iD.geo.Extent([0, 0], [2, 2]);

            var graph = base.replace(node).remove(node);
            expect(tree.intersects(extent, graph)).to.eql([]);

            base.rebase({n: node});
            tree.rebase([node]);
            expect(tree.intersects(extent, graph)).to.eql([]);
        });
    });
});
