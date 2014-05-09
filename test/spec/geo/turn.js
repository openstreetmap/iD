describe('iD.geo.Turn', function() {
    describe('#angle', function() {
        it("calculates the angle of via to toward", function() {
            function projection(x) { return x; }

            var turn = iD.geo.Turn({
                via: iD.Node({id: 'v', loc: [1, 0]}),
                toward: iD.Node({id: 'w', loc: [1, 1]})
            });

            expect(turn.angle(projection)).to.eql(Math.PI / 2);
        });
    });
});

describe("iD.geo.turns", function() {
    function properties(turns) {
        return turns.map(function (turn) { return _.pick(turn, 'from', 'to', 'via', 'toward', 'restriction') });
    }

    it("returns an empty array for non-ways", function() {
        var graph = iD.Graph([
            iD.Node({id: 'n'})
        ]);
        expect(iD.geo.turns(graph, 'n')).to.eql([]);
    });

    it("returns an empty array for non-lines", function() {
        var graph = iD.Graph([
            iD.Node({id: 'u'}),
            iD.Node({id: 'v'}),
            iD.Node({id: 'w'}),
            iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential', area: 'yes'}}),
            iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
        ]);
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("returns an empty array for an unconnected way", function() {
        var graph = iD.Graph([
            iD.Node({id: 'u'}),
            iD.Node({id: 'v'}),
            iD.Way({id: '=', nodes: ['u', 'v']})
        ]);
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("omits turns onto degenerate ways", function() {
        var graph = iD.Graph([
            iD.Node({id: 'u'}),
            iD.Node({id: 'v'}),
            iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            iD.Way({id: '-', nodes: ['v'], tags: {highway: 'residential'}})
        ]);
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("omits turns from non-highways", function() {
        var graph = iD.Graph([
            iD.Node({id: 'u'}),
            iD.Node({id: 'v'}),
            iD.Node({id: 'w'}),
            iD.Way({id: '=', nodes: ['u', 'v']}),
            iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
        ]);
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("omits turns onto non-highways", function() {
        var graph = iD.Graph([
            iD.Node({id: 'u'}),
            iD.Node({id: 'v'}),
            iD.Node({id: 'w'}),
            iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            iD.Way({id: '-', nodes: ['v', 'w']})
        ]);
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("omits turns onto non-lines", function() {
        var graph = iD.Graph([
            iD.Node({id: 'u'}),
            iD.Node({id: 'v'}),
            iD.Node({id: 'w'}),
            iD.Node({id: 'x'}),
            iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            iD.Way({id: '-', nodes: ['v', 'w', 'x', 'v'], tags: {highway: 'residential', area: 'yes'}})
        ]);
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("permits turns onto a way forward", function() {
        // u====v--->w
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: 'v'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
                iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
            ]),
            turns = iD.geo.turns(graph, '=');

        expect(properties(turns)).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w')
        }]);
    });

    it("permits turns onto a way backward", function() {
        // u====v<---w
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: 'v'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
                iD.Way({id: '-', nodes: ['w', 'v'], tags: {highway: 'residential'}})
            ]),
            turns = iD.geo.turns(graph, '=');

        expect(properties(turns)).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w')
        }]);
    });

    it("permits turns onto a way in both directions", function() {
        //     w
        //     |
        // u===v
        //     |
        //     x
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: 'v'}),
                iD.Node({id: 'w'}),
                iD.Node({id: 'x'}),
                iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
                iD.Way({id: '-', nodes: ['w', 'v', 'x'], tags: {highway: 'residential'}})
            ]),
            turns = iD.geo.turns(graph, '=');

        expect(properties(turns)).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w')
        }, {
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('x')
        }]);
    });

    it("permits turns from a oneway forward", function() {
        // u===>v----w
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: 'v'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential', oneway: 'yes'}}),
                iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
            ]),
            turns = iD.geo.turns(graph, '=');

        expect(properties(turns)).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w')
        }]);
    });

    it("permits turns from a reverse oneway backward", function() {
        // u<===v----w
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: 'v'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['v', 'u'], tags: {highway: 'residential', oneway: '-1'}}),
                iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
            ]),
            turns = iD.geo.turns(graph, '=');

        expect(properties(turns)).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w')
        }]);
    });

    it("omits turns from a oneway backward", function() {
        // u<===v----w
        var graph = iD.Graph([
            iD.Node({id: 'u'}),
            iD.Node({id: 'v'}),
            iD.Node({id: 'w'}),
            iD.Way({id: '=', nodes: ['v', 'u'], tags: {highway: 'residential', oneway: 'yes'}}),
            iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
        ]);
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("omits turns from a reverse oneway forward", function() {
        // u===>v----w
        var graph = iD.Graph([
            iD.Node({id: 'u'}),
            iD.Node({id: 'v'}),
            iD.Node({id: 'w'}),
            iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential', oneway: '-1'}}),
            iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
        ]);
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("permits turns onto a oneway forward", function() {
        // u====v--->w
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: 'v'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
                iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential', oneway: 'yes'}})
            ]),
            turns = iD.geo.turns(graph, '=');

        expect(properties(turns)).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w')
        }]);
    });

    it("permits turns onto a reverse oneway backward", function() {
        // u====v<---w
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: 'v'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
                iD.Way({id: '-', nodes: ['w', 'v'], tags: {highway: 'residential', oneway: '-1'}})
            ]),
            turns = iD.geo.turns(graph, '=');

        expect(properties(turns)).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w')
        }]);
    });

    it("omits turns onto a oneway backward", function() {
        // u====v<---w
        var graph = iD.Graph([
            iD.Node({id: 'u'}),
            iD.Node({id: 'v'}),
            iD.Node({id: 'w'}),
            iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            iD.Way({id: '-', nodes: ['w', 'v'], tags: {highway: 'residential', oneway: 'yes'}})
        ]);
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("omits turns onto a reverse oneway forward", function() {
        // u====v--->w
        var graph = iD.Graph([
            iD.Node({id: 'u'}),
            iD.Node({id: 'v'}),
            iD.Node({id: 'w'}),
            iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential', oneway: '-1'}})
        ]);
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("restricts turns with a restriction relation", function() {
        // u====v--->w
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: 'v'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
                iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}}),
                iD.Relation({id: 'r', tags: {type: 'restriction'}, members: [
                    {id: '=', role: 'from', type: 'way'},
                    {id: '-', role: 'to', type: 'way'},
                    {id: 'v', role: 'via', type: 'node'}
                ]})
            ]),
            turns = iD.geo.turns(graph, '=');

        expect(properties(turns)).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w'),
            restriction: graph.entity('r')
        }]);
    });

    // 'no' vs 'only'
    // U-turns
    // Self-intersections
    // Split point
});
