describe("iD.Tree", function() {
    var tree;

    beforeEach(function() {
        tree = iD.Tree(iD.Graph());
    });

    describe("#rebase", function() {
        it("adds entities to the tree", function() {
            var node = iD.Node({ id: 'n', loc: [1, 1]});
            tree.graph().rebase({ 'n': node });
            tree.rebase(['n']);
            expect(tree.intersects(iD.geo.Extent([0, 0], [2, 2]), tree.graph())).to.eql([node]);
        });

        it("does not insert if entity has a modified version", function() {
            var node = iD.Node({ id: 'n', loc: [1, 1]}),
                node_ = node.update({ loc: [10, 10]}),
                g = tree.graph().replace(node_);
            expect(tree.intersects(iD.geo.Extent([9, 9], [11, 11]), g)).to.eql([node_]);
            tree.graph().rebase({ 'n': node });
            tree.rebase(['n']);
            expect(tree.intersects(iD.geo.Extent([0, 0], [2, 2]), g)).to.eql([]);
            expect(tree.intersects(iD.geo.Extent([0, 0], [11, 11]), g)).to.eql([node_]);
        });
    });

    describe("#intersects", function() {
        it("excludes entities with missing children, adds them when all are present", function() {
            var way = iD.Way({id: 'w1', nodes: ['n']});
            var g = tree.graph().replace(way);
            expect(tree.intersects(iD.geo.Extent([0, 0], [1, 1]), g)).to.eql([]);
            var node = iD.Node({id: 'n', loc: [0.5, 0.5]});
            g = tree.graph().replace(node);
            expect(tree.intersects(iD.geo.Extent([0, 0], [1, 1]), g)).to.eql([way, node]);
        });

        it("includes entities that used to have missing children, after rebase added them", function() {
            var base = tree.graph();
            var way = iD.Way({id: 'w1', nodes: ['n']});
            var g = base.replace(way);
            expect(tree.intersects(iD.geo.Extent([0, 0], [1, 1]), g)).to.eql([]);
            var node = iD.Node({id: 'n', loc: [0.5, 0.5]});
            base.rebase({ 'n': node });
            tree.rebase(['n']);
            expect(tree.intersects(iD.geo.Extent([0, 0], [1, 1]), g)).to.eql([way, node]);
        });

        it("includes entities within extent, excludes those without", function() {
            var n1 = iD.Node({ id: 'n1', loc: [1, 1]});
            var n2 = iD.Node({ id: 'n2', loc: [3, 3]});
            var g = tree.graph().replace(n1).replace(n2);
            expect(tree.intersects(iD.geo.Extent([0, 0], [1.1, 1.1]), g)).to.eql([n1]);
        });

        it("doesn't include removed entities", function() {
            var n1 = iD.Node({ id: 'n1', loc: [1, 1]});
            var g = tree.graph().replace(n1);
            expect(tree.intersects(iD.geo.Extent([0, 0], [2, 2]), g)).to.eql([n1]);
            g = g.remove(n1);
            expect(tree.intersects(iD.geo.Extent([0, 0], [2, 2]), g)).to.eql([]);
        });
    });
});
