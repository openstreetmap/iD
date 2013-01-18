describe("iD.actions.SplitWay", function () {
    it("creates a new way with the appropriate nodes", function () {
        // Situation:
        //    a ---- b ---- c
        //
        // Split at b.
        //
        // Expected result:
        //    a ---- b ==== c
        //
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']})
            });

        graph = iD.actions.SplitWay('b', '=')(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b']);
        expect(graph.entity('=').nodes).to.eql(['b', 'c']);
    });

    it("copies tags to the new way", function () {
        var tags = {highway: 'residential'},
            graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c'], tags: tags})
            });

        graph = iD.actions.SplitWay('b', '=')(graph);

        // Immutable tags => should be shared by identity.
        expect(graph.entity('-').tags).to.equal(tags);
        expect(graph.entity('=').tags).to.equal(tags);
    });

    it("moves restriction relations to the new way", function () {
        // Situation:
        //    a ---- b ---- c ~~~~ d
        // A restriction from ---- to ~~~~ via c.
        //
        // Split at b.
        //
        // Expected result:
        //    a ---- b ==== c ~~~~ d
        // A restriction from ==== to ~~~~ via c.
        //
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'd'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                '~': iD.Way({id: '~', nodes: ['c', 'd']}),
                'r': iD.Relation({tags: {type: 'restriction'}, members: [
                    {id: '=', role: 'from'},
                    {id: '~', role: 'to'},
                    {id: 'c', role: 'via'}]})
            });

        graph = iD.actions.SplitWay('b', '=')(graph);

        expect(graph.entity('r').members).to.eql([
            {id: '=', role: 'from'},
            {id: '~', role: 'to'},
            {id: 'c', role: 'via'}]);
    });
});
