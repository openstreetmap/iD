describe('iD.actionMergePolygon', function () {

    function node(id, x, y) {
        e.push(iD.osmNode({ id: id, loc: [x, y] }));
    }

    function way(id, nodes) {
        e.push(iD.osmWay({ id: id, nodes: nodes.map(function(n) { return 'n' + n; }) }));
    }

    var e = [];

    node('n0', 0, 0);
    node('n1', 5, 0);
    node('n2', 5, 5);
    node('n3', 0, 5);

    node('n4', 1, 1);
    node('n5', 4, 1);
    node('n6', 4, 4);
    node('n7', 1, 4);

    node('n8', 2, 2);
    node('n9', 3, 2);
    node('n10', 3, 3);
    node('n11', 2, 3);

    node('n13', 8, 8);
    node('n14', 8, 9);
    node('n15', 9, 9);

    way('w0', [0, 1, 2, 3, 0]);
    way('w1', [4, 5, 6, 7, 4]);
    way('w2', [8, 9, 10, 11, 8]);

    way('w3', [4, 5, 6]);
    way('w4', [6, 7, 4]);

    way('w5', [13, 14, 15, 13]);

    var graph;

    beforeEach(function() {
        graph = iD.coreGraph(e);
    });

    function find(relation, id) {
        return relation.members.find(function (m) { return m.id === id; });
    }

    it('creates a multipolygon from two closed ways', function() {
        graph = iD.actionMergePolygon(['w0', 'w1'], 'r')(graph);
        var r = graph.entity('r');
        expect(!!r).to.equal(true);
        expect(r.geometry(graph)).to.equal('area');
        expect(r.isMultipolygon()).to.equal(true);
        expect(r.members.length).to.equal(2);
        expect(find(r, 'w0').role).to.equal('outer');
        expect(find(r, 'w0').type).to.equal('way');
        expect(find(r, 'w1').role).to.equal('inner');
        expect(find(r, 'w1').type).to.equal('way');
    });

    it('creates a multipolygon from a closed way and a multipolygon relation', function() {
        graph = iD.actionMergePolygon(['w0', 'w1'], 'r')(graph);
        graph = iD.actionMergePolygon(['r', 'w2'])(graph);
        var r = graph.entity('r');
        expect(r.members.length).to.equal(3);
    });

    it('creates a multipolygon from two multipolygon relations', function() {
        graph = iD.actionMergePolygon(['w0', 'w1'], 'r')(graph);
        graph = iD.actionMergePolygon(['w2', 'w5'], 'r2')(graph);
        graph = iD.actionMergePolygon(['r', 'r2'])(graph);

        // Delete other relation
        expect(graph.hasEntity('r2')).to.equal(undefined);

        var r = graph.entity('r');
        expect(find(r, 'w0').role).to.equal('outer');
        expect(find(r, 'w1').role).to.equal('inner');
        expect(find(r, 'w2').role).to.equal('outer');
        expect(find(r, 'w5').role).to.equal('outer');
    });

    it('merges multipolygon tags', function() {
        var graph = iD.coreGraph([
            iD.osmRelation({id: 'r1', tags: {type: 'multipolygon', a: 'a'}}),
            iD.osmRelation({id: 'r2', tags: {type: 'multipolygon', b: 'b'}})
        ]);

        graph = iD.actionMergePolygon(['r1', 'r2'])(graph);

        expect(graph.entity('r1').tags.a).to.equal('a');
        expect(graph.entity('r1').tags.b).to.equal('b');
    });

    it('merges tags from closed outer ways', function() {
        graph = graph.replace(graph.entity('w0').update({ tags: { 'building': 'yes' }}));
        graph = iD.actionMergePolygon(['w0', 'w5'], 'r')(graph);
        expect(graph.entity('w0').tags.building).to.equal(undefined);
        expect(graph.entity('r').tags.building).to.equal('yes');
    });

    it('merges no tags from unclosed outer ways', function() {
        graph = graph.replace(graph.entity('w3').update({ tags: { 'natural': 'water' }}));

        var r1 = iD.osmRelation({id: 'r1', tags: {type: 'multipolygon'}});
        var r2 = iD.osmRelation({id: 'r2', tags: {type: 'multipolygon'},
            members: [
                { type: 'way', role: 'outer', id: 'w3' },
                { type: 'way', role: 'outer', id: 'w4' }
            ]});

        graph = graph.replace(r1).replace(r2);
        graph = iD.actionMergePolygon(['r1', 'r2'])(graph);
        expect(graph.entity('w3').tags.natural).to.equal('water');
        expect(graph.entity('r1').tags.natural).to.equal(undefined);
    });

    it('merges no tags from inner ways', function() {
        graph = graph.replace(graph.entity('w1').update({ tags: { 'natural': 'water' }}));
        graph = iD.actionMergePolygon(['w0', 'w1'], 'r')(graph);
        expect(graph.entity('w1').tags.natural).to.equal('water');
        expect(graph.entity('r').tags.natural).to.equal(undefined);
    });

    it('doesn\'t copy area tags from ways', function() {
        graph = graph.replace(graph.entity('w0').update({ tags: { 'area': 'yes' }}));
        graph = iD.actionMergePolygon(['w0', 'w1'], 'r')(graph);
        var r = graph.entity('r');
        expect(r.tags.area).to.equal(undefined);
    });

    it('creates a multipolygon with two disjunct outer rings', function() {
        graph = iD.actionMergePolygon(['w0', 'w5'], 'r')(graph);
        var r = graph.entity('r');
        expect(find(r, 'w0').role).to.equal('outer');
        expect(find(r, 'w5').role).to.equal('outer');
    });

    it('creates a multipolygon with an island in a hole', function() {
        graph = iD.actionMergePolygon(['w0', 'w1'], 'r')(graph);
        graph = iD.actionMergePolygon(['r', 'w2'])(graph);
        var r = graph.entity('r');
        expect(find(r, 'w0').role).to.equal('outer');
        expect(find(r, 'w1').role).to.equal('inner');
        expect(find(r, 'w2').role).to.equal('outer');
    });

    it('extends a multipolygon with multi-way rings', function() {
        var r = iD.osmRelation({ id: 'r', tags: { type: 'multipolygon' }, members: [
            { type: 'way', role: 'outer', id: 'w0' },
            { type: 'way', role: 'inner', id: 'w3' },
            { type: 'way', role: 'inner', id: 'w4' }
        ]});
        graph = graph.replace(r);
        graph = iD.actionMergePolygon(['r', 'w2'])(graph);
        r = graph.entity('r');
        expect(find(r, 'w0').role).to.equal('outer');
        expect(find(r, 'w2').role).to.equal('outer');
        expect(find(r, 'w3').role).to.equal('inner');
        expect(find(r, 'w4').role).to.equal('inner');
    });
});
