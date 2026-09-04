describe('iD.actionRestrictTurn', function() {
    it('adds a via node restriction to an unrestricted turn', function() {
        //
        // u === * --- w
        //
        var graph = new iD.coreGraph([
            new iD.osmNode({id: 'u'}),
            new iD.osmNode({id: '*'}),
            new iD.osmNode({id: 'w'}),
            new iD.osmWay({id: '=', nodes: ['u', '*']}),
            new iD.osmWay({id: '-', nodes: ['*', 'w']})
        ]);

        var turn = {
            from: { node: 'u', way: '=' },
            via:  { node: '*'},
            to:   { node: 'w', way: '-' }
        };

        var action = iD.actionRestrictTurn(turn, 'no_straight_on', 'r');
        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).toEqual({type: 'restriction', restriction: 'no_straight_on'});

        var f = r.memberByRole('from');
        expect(f.id).toEqual('=');
        expect(f.type).toEqual('way');

        var v = r.memberByRole('via');
        expect(v.id).toEqual('*');
        expect(v.type).toEqual('node');

        var t = r.memberByRole('to');
        expect(t.id).toEqual('-');
        expect(t.type).toEqual('way');
    });


    it('adds a via way restriction to an unrestricted turn', function() {
        //
        // u === v1
        //       |
        // w --- v2
        //
        var graph = new iD.coreGraph([
            new iD.osmNode({id: 'u'}),
            new iD.osmNode({id: 'v1'}),
            new iD.osmNode({id: 'v2'}),
            new iD.osmNode({id: 'w'}),
            new iD.osmWay({id: '=', nodes: ['u', 'v1']}),
            new iD.osmWay({id: '|', nodes: ['v1', 'v2']}),
            new iD.osmWay({id: '-', nodes: ['v2', 'w']})
        ]);

        var turn = {
            from: { node: 'u', way: '=' },
            via:  { ways: ['|'] },
            to:   { node: 'w', way: '-' }
        };

        var action = iD.actionRestrictTurn(turn, 'no_u_turn', 'r');
        graph = action(graph);

        var r = graph.entity('r');
        expect(r.tags).toEqual({type: 'restriction', restriction: 'no_u_turn'});

        var f = r.memberByRole('from');
        expect(f.id).toEqual('=');
        expect(f.type).toEqual('way');

        var v = r.memberByRole('via');
        expect(v.id).toEqual('|');
        expect(v.type).toEqual('way');

        var t = r.memberByRole('to');
        expect(t.id).toEqual('-');
        expect(t.type).toEqual('way');
    });
});
