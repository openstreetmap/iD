describe("iD.Tree", function() {
    describe("#rebase", function() {
        it("adds entities to the tree", function() {
            var graph = iD.Graph(),
                tree = iD.Tree(graph),
                node = iD.Node({id: 'n', loc: [1, 1]});

            graph.rebase({n: node});
            tree.rebase(['n']);

            expect(tree.intersects(iD.geo.Extent([0, 0], [2, 2]), graph)).to.eql([node]);
        });

        it("does not insert if entity has a modified version", function() {
            var graph = iD.Graph(),
                tree = iD.Tree(graph),
                node = iD.Node({id: 'n', loc: [1, 1]}),
                node_ = node.update({loc: [10, 10]}),
                g = graph.replace(node_);

            expect(tree.intersects(iD.geo.Extent([9, 9], [11, 11]), g)).to.eql([node_]);

            graph.rebase({n: node});
            tree.rebase(['n']);

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
            tree.rebase(['n']);
            expect(tree.intersects(extent, graph)).to.eql([node, way]);
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
    });
});
