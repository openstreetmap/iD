describe('iD.actionUnrestrictTurn', function() {
    it('removes a restriction from a restricted turn', function() {
        //
        // u === * --- w
        //
        var graph = iD.coreGraph([
            iD.osmNode({ id: 'u' }),
            iD.osmNode({ id: '*' }),
            iD.osmNode({ id: 'w' }),
            iD.osmWay({ id: '=', nodes: ['u', '*'], tags: { highway: 'residential' } }),
            iD.osmWay({ id: '-', nodes: ['*', 'w'], tags: { highway: 'residential' } }),
            iD.osmRelation({ id: 'r', tags: { type: 'restriction' }, members: [
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
