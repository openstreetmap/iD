describe('iD.operationDetachNode', function () {
    var fakeContext;
    var graph;
    var fakeTags = { 'name': 'fake' };
    beforeEach(function () {
        // Set up graph
        var createFakeNode = function (id, hasTags) {
            return hasTags
                ? { id: id, type: 'node', tags: fakeTags }
                : { id: id, type: 'node' };
        };
        // a - node with tags & parent way
        // b - node with tags & 2 parent ways
        // c - node with no tags, parent way
        // d - node with no tags, 2 parent ways
        // e - node with tags, no parent way
        // f - node with no tags, no parent way
        graph = iD.Graph([
            iD.Node(createFakeNode('a', true)),
            iD.Node(createFakeNode('b', true)),
            iD.Node(createFakeNode('c', false)),
            iD.Node(createFakeNode('d', false)),
            iD.Node(createFakeNode('e', true)),
            iD.Node(createFakeNode('f', false)),
            iD.Way({ id: 'x', nodes: ['a', 'b', 'c', 'd'] }),
            iD.Way({ id: 'y', nodes: ['b', 'd'] })
        ]);

        // Set up the fake context
        fakeContext = {};
        fakeContext.graph = function () {
            return graph;
        };
    });

    it('is not available for no selected ids', function () {
        var result = iD.operationDetachNode([], fakeContext).available();
        expect(result).to.eql(false);
    });

    it('is not available for two selected ids', function () {
        var result = iD.operationDetachNode(['a', 'b'], fakeContext).available();
        expect(result).to.eql(false);
    });

    it('is not available for unkown selected id', function () {
        var result = iD.operationDetachNode(['z'], fakeContext).available();
        expect(result).to.eql(false);
    });

    it('is not available for selected way', function () {
        var result = iD.operationDetachNode(['x'], fakeContext).available();
        expect(result).to.eql(false);
    });

    it('is not available for selected node with tags, no parent way', function () {
        var result = iD.operationDetachNode(['e'], fakeContext).available();
        expect(result).to.eql(false);
    });

    it('is not available for selected node with no tags, no parent way', function () {
        var result = iD.operationDetachNode(['f'], fakeContext).available();
        expect(result).to.eql(false);
    });

    it('is not available for selected node with no tags, parent way', function () {
        var result = iD.operationDetachNode(['c'], fakeContext).available();
        expect(result).to.eql(false);
    });

    it('is not available for selected node with no tags, two parent ways', function () {
        var result = iD.operationDetachNode(['d'], fakeContext).available();
        expect(result).to.eql(false);
    });

    it('is available for selected node with tags, parent way', function () {
        var result = iD.operationDetachNode(['a'], fakeContext).available();
        expect(result).to.eql(true);
    });

    it('is available for selected node with tags, two parent ways', function () {
        var result = iD.operationDetachNode(['b'], fakeContext).available();
        expect(result).to.eql(true);
    });
});
