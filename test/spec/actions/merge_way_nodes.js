describe('iD.actionMergeWayNodes', function () {

    function node(id, x, y, tags) {
        e.push(iD.Node({ id: id, loc: [x, y], tags: tags }));
    }

    function way(id, nodes) {
        e.push(iD.Way({ id: id, nodes: nodes.map(function(n) { return 'n' + n; }) }));
    }

    var e = [];

    node('n0', 0, 0, { highway: 'traffic_signals' });
    node('n1', 10, 5);
    node('n2', 15, 12);
    node('n3', 35, 15);

    node('n4', 5, 1, { traffic_signals: 'signal' });
    node('n5', 18, 10);
    node('n6', 24, 23);
    node('n7', 32, 20);

    node('n8', 10, 5);
    node('n9', 18, 17);
    node('n10', 20, 25);
    node('n11', 22, 31);

    way('w0', [0, 1, 2, 3]);
    way('w1', [4, 5, 6, 7]);
    way('w2', [8, 9, 19, 11]);

    var graph;

    beforeEach(function() {
        graph = iD.Graph(e);
    });

    function has(arr, findVal) {
        return arr.some(function(val) { return val === findVal; });
    }

    it('It is possible to apply the action for both internal and endpoint nodes', function() {
        expect(!!iD.actionMergeWayNodes(['n2', 'n7']).disabled(graph)).to.equal(false);
    });

    it('merges two nodes from two ways', function() {
        graph = iD.actionMergeWayNodes(['n2', 'n7'], 'n100')(graph);
        expect(graph.hasEntity('n2')).to.equal(undefined);
        expect(graph.hasEntity('n7')).to.equal(undefined);

        var n = graph.entity('n100');

        expect(!!n).to.equal(true);
        expect(graph.parentWays(n).length).to.equal(2);
        expect(has(graph.entity('w0').nodes, 'n100')).to.equal(true);
        expect(has(graph.entity('w1').nodes, 'n100')).to.equal(true);
    });

    it('merges three nodes from three ways', function () {
        graph = iD.actionMergeWayNodes(['n0', 'n4', 'n8'], 'n100')(graph);
        expect(graph.hasEntity('n0')).to.equal(undefined);
        expect(graph.hasEntity('n4')).to.equal(undefined);
        expect(graph.hasEntity('n8')).to.equal(undefined);

        var n = graph.entity('n100');

        expect(graph.parentWays(n).length).to.equal(3);
        expect(has(graph.entity('w0').nodes, 'n100')).to.equal(true);
        expect(has(graph.entity('w1').nodes, 'n100')).to.equal(true);
        expect(has(graph.entity('w2').nodes, 'n100')).to.equal(true);
    });

    it('merges tags of nodes', function() {
        graph = iD.actionMergeWayNodes(['n0', 'n4'], 'n100')(graph);
        expect(graph.entity('n100').tags).to.deep.equal({highway: 'traffic_signals', traffic_signals: 'signal'});
    });
});