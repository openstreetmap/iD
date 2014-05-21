describe("iD.actions.UnrestrictTurn", function() {
    it('removes a restriction from a restricted turn', function() {
        // u====*--->w
        var graph = iD.Graph([
                iD.Node({id: 'u'}),
                iD.Node({id: '*'}),
                iD.Node({id: 'w'}),
                iD.Way({id: '=', nodes: ['u', '*'], tags: {highway: 'residential'}}),
                iD.Way({id: '-', nodes: ['*', 'w'], tags: {highway: 'residential'}}),
                iD.Relation({id: 'r', tags: {type: 'restriction'}, members: [
                    {id: '=', role: 'from', type: 'way'},
                    {id: '-', role: 'to', type: 'way'},
                    {id: '*', role: 'via', type: 'node'}
                ]})
            ]),
            action = iD.actions.UnrestrictTurn({
                restriction: 'r'
            });

        graph = action(graph);

        expect(graph.hasEntity('r')).to.be.undefined;
    });
});
