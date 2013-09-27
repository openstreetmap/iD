describe("iD.geo.turns", function() {
    it("returns an empty array for non-ways", function() {
        var graph = iD.Graph({
            'n': iD.Node({id: 'n'})
        });
        expect(iD.geo.turns(graph, 'n')).to.eql([]);
    });

    it("returns an empty array for non-lines", function() {
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential', area: 'yes'}}),
            '-': iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("returns an empty array for an unconnected way", function() {
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v']})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("omits turns onto degenerate ways", function() {
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            '-': iD.Way({id: '-', nodes: ['v'], tags: {highway: 'residential'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("omits turns from non-highways", function() {
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v']}),
            '-': iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("omits turns onto non-highways", function() {
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            '-': iD.Way({id: '-', nodes: ['v', 'w']})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("omits turns onto non-lines", function() {
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            'x': iD.Node({id: 'x'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            '-': iD.Way({id: '-', nodes: ['v', 'w', 'x', 'v'], tags: {highway: 'residential', area: 'yes'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("permits turns onto a way forward", function() {
        // u====v--->w
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            '-': iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w')
        }]);
    });

    it("permits turns onto a way backward", function() {
        // u====v<---w
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            '-': iD.Way({id: '-', nodes: ['w', 'v'], tags: {highway: 'residential'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([{
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
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            'x': iD.Node({id: 'x'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            '-': iD.Way({id: '-', nodes: ['w', 'v', 'x'], tags: {highway: 'residential'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([{
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
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential', oneway: 'yes'}}),
            '-': iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w')
        }]);
    });

    it("permits turns from a reverse oneway backward", function() {
        // u<===v----w
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['v', 'u'], tags: {highway: 'residential', oneway: '-1'}}),
            '-': iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w')
        }]);
    });

    it("omits turns from a oneway backward", function() {
        // u<===v----w
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['v', 'u'], tags: {highway: 'residential', oneway: 'yes'}}),
            '-': iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("omits turns from a reverse oneway forward", function() {
        // u===>v----w
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential', oneway: '-1'}}),
            '-': iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("permits turns onto a oneway forward", function() {
        // u====v--->w
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            '-': iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential', oneway: 'yes'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w')
        }]);
    });

    it("permits turns onto a reverse oneway backward", function() {
        // u====v<---w
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            '-': iD.Way({id: '-', nodes: ['w', 'v'], tags: {highway: 'residential', oneway: '-1'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w')
        }]);
    });

    it("omits turns onto a oneway backward", function() {
        // u====v<---w
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            '-': iD.Way({id: '-', nodes: ['w', 'v'], tags: {highway: 'residential', oneway: 'yes'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("omits turns onto a reverse oneway forward", function() {
        // u====v--->w
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            '-': iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential', oneway: '-1'}})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([]);
    });

    it("restricts turns with a restriction relation", function() {
        // u====v--->w
        var graph = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            '=': iD.Way({id: '=', nodes: ['u', 'v'], tags: {highway: 'residential'}}),
            '-': iD.Way({id: '-', nodes: ['v', 'w'], tags: {highway: 'residential'}}),
            'r': iD.Relation({id: 'r', tags: {type: 'restriction'}, members: [
                {id: '=', role: 'from', type: 'way'},
                {id: '-', role: 'to', type: 'way'},
                {id: 'v', role: 'via', type: 'node'}
            ]})
        });
        expect(iD.geo.turns(graph, '=')).to.eql([{
            from: graph.entity('='),
            to: graph.entity('-'),
            via: graph.entity('v'),
            toward: graph.entity('w'),
            restriction: graph.entity('r')
        }]);
    });

    // U-turns
    // Self-intersections
    // Split point
});
