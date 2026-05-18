describe('iD.actionUnrestrictTurn', function() {
    it('removes a restriction from a restricted turn', function() {
        //
        // u === * --- w
        //
        var graph = new iD.coreGraph([
            new iD.osmNode({ id: 'u' }),
            new iD.osmNode({ id: '*' }),
            new iD.osmNode({ id: 'w' }),
            new iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential' } }),
            new iD.osmWay({ id: '-', nodes: ['*', 'w'], tags: { highway: 'residential' } }),
            new iD.osmRelation({ id: 'r', tags: { type: 'restriction' }, members: [
                { id: '=', role: 'from', type: 'way' },
                { id: '-', role: 'to', type: 'way' },
                { id: '*', role: 'via', type: 'node' }
            ]})
        ]);
        var action = iD.actionUnrestrictTurn({ restrictionID: 'r' });

        graph = action(graph);
        expect(graph.hasEntity('r')).to.be.undefined;
    });
});
