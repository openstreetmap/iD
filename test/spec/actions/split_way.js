describe("iD.actions.SplitWay", function () {
    describe("#enabled", function () {
        it("returns true for a non-end node of a single way", function () {
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']})
                });

            expect(iD.actions.SplitWay('b').enabled(graph)).to.be.true;
        });

        it("returns false for the first node of a single way", function () {
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b']})
                });

            expect(iD.actions.SplitWay('a').enabled(graph)).to.be.false;
        });

        it("returns false for the last node of a single way", function () {
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b']})
                });

            expect(iD.actions.SplitWay('b').enabled(graph)).to.be.false;
        });
    });

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

    it("splits a way at a T-junction", function () {
        // Situation:
        //    a ---- b ---- c
        //           |
        //           d
        //
        // Split at b.
        //
        // Expected result:
        //    a ---- b ==== c
        //           |
        //           d
        //
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'd'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                '|': iD.Way({id: '|', nodes: ['d', 'b']})
            });

        graph = iD.actions.SplitWay('b', '=')(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b']);
        expect(graph.entity('=').nodes).to.eql(['b', 'c']);
        expect(graph.entity('|').nodes).to.eql(['d', 'b']);
    });

    it("adds the new way to parent relations (no connections)", function () {
        // Situation:
        //    a ---- b ---- c
        //    Relation: [----]
        //
        // Split at b.
        //
        // Expected result:
        //    a ---- b ==== c
        //    Relation: [----, ====]
        //
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                'r': iD.Relation({id: 'r', members: [{id: '-', type: 'way'}]})
            });

        graph = iD.actions.SplitWay('b', '=')(graph);

        expect(_.pluck(graph.entity('r').members, 'id')).to.eql(['-', '=']);
    });

    it("adds the new way to parent relations (forward order)", function () {
        // Situation:
        //    a ---- b ---- c ~~~~ d
        //    Relation: [----, ~~~~]
        //
        // Split at b.
        //
        // Expected result:
        //    a ---- b ==== c ~~~~ d
        //    Relation: [----, ====, ~~~~]
        //
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'd'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                '~': iD.Way({id: '~', nodes: ['c', 'd']}),
                'r': iD.Relation({id: 'r', members: [{id: '-', type: 'way'}, {id: '~', type: 'way'}]})
            });

        graph = iD.actions.SplitWay('b', '=')(graph);

        expect(_.pluck(graph.entity('r').members, 'id')).to.eql(['-', '=', '~']);
    });

    it("adds the new way to parent relations (reverse order)", function () {
        // Situation:
        //    a ---- b ---- c ~~~~ d
        //    Relation: [~~~~, ----]
        //
        // Split at b.
        //
        // Expected result:
        //    a ---- b ==== c ~~~~ d
        //    Relation: [~~~~, ====, ----]
        //
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'd'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                '~': iD.Way({id: '~', nodes: ['c', 'd']}),
                'r': iD.Relation({id: 'r', members: [{id: '~', type: 'way'}, {id: '-', type: 'way'}]})
            });

        graph = iD.actions.SplitWay('b', '=')(graph);

        expect(_.pluck(graph.entity('r').members, 'id')).to.eql(['~', '=', '-']);
    });

    it("handles incomplete relations", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                'r': iD.Relation({id: 'r', members: [{id: '~', type: 'way'}, {id: '-', type: 'way'}]})
            });

        graph = iD.actions.SplitWay('b', '=')(graph);

        expect(_.pluck(graph.entity('r').members, 'id')).to.eql(['~', '-', '=']);
    });

    ['restriction', 'restriction:bus'].forEach(function (type) {
        it("updates a restriction's 'from' role", function () {
            // Situation:
            //    a ----> b ----> c ~~~~ d
            // A restriction from ---- to ~~~~ via c.
            //
            // Split at b.
            //
            // Expected result:
            //    a ----> b ====> c ~~~~ d
            // A restriction from ==== to ~~~~ via c.
            //
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    'd': iD.Node({id: 'd'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                    '~': iD.Way({id: '~', nodes: ['c', 'd']}),
                    'r': iD.Relation({id: 'r', tags: {type: type}, members: [
                        {id: '-', role: 'from'},
                        {id: '~', role: 'to'},
                        {id: 'c', role: 'via'}]})
                });

            graph = iD.actions.SplitWay('b', '=')(graph);

            expect(graph.entity('r').members).to.eql([
                {id: '=', role: 'from'},
                {id: '~', role: 'to'},
                {id: 'c', role: 'via'}]);
        });

        it("updates a restriction's 'to' role", function () {
            // Situation:
            //    a ----> b ----> c ~~~~ d
            // A restriction from ~~~~ to ---- via c.
            //
            // Split at b.
            //
            // Expected result:
            //    a ----> b ====> c ~~~~ d
            // A restriction from ~~~~ to ==== via c.
            //
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    'd': iD.Node({id: 'd'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']}),
                    '~': iD.Way({id: '~', nodes: ['c', 'd']}),
                    'r': iD.Relation({id: 'r', tags: {type: type}, members: [
                        {id: '~', role: 'from'},
                        {id: '-', role: 'to'},
                        {id: 'c', role: 'via'}]})
                });

            graph = iD.actions.SplitWay('b', '=')(graph);

            expect(graph.entity('r').members).to.eql([
                {id: '~', role: 'from'},
                {id: '=', role: 'to'},
                {id: 'c', role: 'via'}]);
        });

        it("leaves unaffected restrictions unchanged", function () {
            // Situation:
            //    a <---- b <---- c ~~~~ d
            // A restriction from ---- to ~~~~ via c.
            //
            // Split at b.
            //
            // Expected result:
            //    a <==== b <---- c ~~~~ d
            // A restriction from ---- to ~~~~ via c.
            //
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    'd': iD.Node({id: 'd'}),
                    '-': iD.Way({id: '-', nodes: ['c', 'b', 'a']}),
                    '~': iD.Way({id: '~', nodes: ['c', 'd']}),
                    'r': iD.Relation({id: 'r', tags: {type: type}, members: [
                        {id: '-', role: 'from'},
                        {id: '~', role: 'to'},
                        {id: 'c', role: 'via'}]})
                });

            graph = iD.actions.SplitWay('b', '=')(graph);

            expect(graph.entity('r').members).to.eql([
                {id: '-', role: 'from'},
                {id: '~', role: 'to'},
                {id: 'c', role: 'via'}]);
        });
    });
});
