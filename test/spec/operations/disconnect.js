describe('iD.operationDisconnect', function () {
    var fakeContext;
    var graph;

    // Set up the fake context
    fakeContext = {};
    fakeContext.graph = function() { return graph; };
    fakeContext.entity = function(id) { return graph.entity(id); };
    fakeContext.hasHiddenConnections = function() { return false; };
    fakeContext.inIntro = function() { return false; };
    fakeContext.connection = function() { return null; };
    fakeContext.perform = function(fn) { graph = fn(graph); };
    fakeContext.validator = function() { return { validate: function() {} }; };
    fakeContext.map = function() {
        return {
            extent: function() {
                return iD.geoExtent([-180, -90], [180, 90]);
            }
        };
    };

    beforeEach(function () {
        // a - vertex shared by w1 and w2
        // b - vertex shared by w1 and w3
        // c - vertex only on w1 (nothing to disconnect)
        // p - standalone point
        graph = new iD.coreGraph([
            new iD.osmNode({ id: 'a', loc: [1, 0] }),
            new iD.osmNode({ id: 'b', loc: [2, 0] }),
            new iD.osmNode({ id: 'c', loc: [0, 0] }),
            new iD.osmNode({ id: 'x', loc: [3, 0] }),
            new iD.osmNode({ id: 'y', loc: [1, 1] }),
            new iD.osmNode({ id: 'z', loc: [2, 1] }),
            new iD.osmNode({ id: 'p', loc: [5, 5], tags: { amenity: 'bench' } }),
            new iD.osmWay({ id: 'w1', nodes: ['c', 'a', 'b', 'x'] }),
            new iD.osmWay({ id: 'w2', nodes: ['a', 'y'] }),
            new iD.osmWay({ id: 'w3', nodes: ['b', 'z'] })
        ]);
    });

    function parentWayCount(id) {
        return graph.parentWays(graph.entity(id)).length;
    }

    it('is disabled for a single vertex that is not connected', function () {
        var operation = iD.operationDisconnect(fakeContext, ['c']);
        expect(operation.available()).toBeTruthy();
        expect(operation.disabled()).toBe('not_connected');
    });

    it('disconnects the connected vertices of a node multiselection and leaves the others unchanged', function () {
        var operation = iD.operationDisconnect(fakeContext, ['a', 'b', 'c']);
        expect(operation.available()).toBeTruthy();
        expect(operation.disabled()).toBeFalsy();

        operation();
        expect(parentWayCount('a')).toBe(1);
        expect(parentWayCount('b')).toBe(1);
        expect(parentWayCount('c')).toBe(1);
        expect(graph.entity('w1').nodes).toContain('c');
    });

    it('ignores standalone points in a node multiselection', function () {
        var operation = iD.operationDisconnect(fakeContext, ['a', 'p']);
        expect(operation.available()).toBeTruthy();
        expect(operation.disabled()).toBeFalsy();

        operation();
        expect(parentWayCount('a')).toBe(1);
        expect(graph.hasEntity('p')).toBeTruthy();
    });

    it('is disabled when none of the selected vertices are connected', function () {
        var operation = iD.operationDisconnect(fakeContext, ['c', 'p']);
        expect(operation.disabled()).toBe('not_connected');
    });

    it('is not available for points only', function () {
        graph = graph.replace(new iD.osmNode({ id: 'q', loc: [6, 6] }));
        var operation = iD.operationDisconnect(fakeContext, ['p', 'q']);
        expect(operation.available()).toBeFalsy();
    });

    it('keeps requiring every vertex to be disconnectable when ways are also selected', function () {
        var operation = iD.operationDisconnect(fakeContext, ['w1', 'a', 'c']);
        expect(operation.disabled()).toBe('not_connected');
    });
});
