describe("iD.Tree", function() {
    var tree;

    beforeEach(function() {
        tree = iD.Tree(iD.Graph());
    });

    describe("intersects", function() {
        it("excludes entities with missing children, adds them when all are present", function() {
            var way = iD.Way({id: 'w1', nodes: ['n']});
            var g = tree.base().replace(way);
            expect(tree.intersects(iD.geo.Extent([0, 0], [1, 1]), g)).to.eql([]);
            var node = iD.Node({id: 'n', loc: [0.5, 0.5]});
            g = tree.base().replace(node);
            expect(tree.intersects(iD.geo.Extent([0, 0], [1, 1]), g)).to.eql([way, node]);
        });
    });
});
