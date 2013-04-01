describe("iD.actions.Split", function () {
    describe("#disabled", function () {
        it("returns falsy for a non-end node of a single way", function () {
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b', 'c']})
                });

            expect(iD.actions.Split('b').disabled(graph)).not.to.be.ok;
        });

        it("returns falsy for an intersection of two ways", function () {
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    'd': iD.Node({id: 'c'}),
                    '*': iD.Node({id: '*'}),
                    '-': iD.Way({id: '-', nodes: ['a', '*', 'b']}),
                    '|': iD.Way({id: '|', nodes: ['c', '*', 'd']})
            });

            expect(iD.actions.Split('*').disabled(graph)).not.to.be.ok;
        });

        it("returns falsy for an intersection of two ways with parent way specified", function () {
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    'd': iD.Node({id: 'c'}),
                    '*': iD.Node({id: '*'}),
                    '-': iD.Way({id: '-', nodes: ['a', '*', 'b']}),
                    '|': iD.Way({id: '|', nodes: ['c', '*', 'd']})
            });

            expect(iD.actions.Split('*').limitWays(['-']).disabled(graph)).not.to.be.ok;
        });

        it("returns falsy for a self-intersection", function () {
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    'd': iD.Node({id: 'c'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'a', 'd']})
            });

            expect(iD.actions.Split('a').disabled(graph)).not.to.be.ok;
        });

        it("returns 'not_eligible' for the first node of a single way", function () {
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b']})
                });

            expect(iD.actions.Split('a').disabled(graph)).to.equal('not_eligible');
        });

        it("returns 'not_eligible' for the last node of a single way", function () {
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    '-': iD.Way({id: '-', nodes: ['a', 'b']})
                });

            expect(iD.actions.Split('b').disabled(graph)).to.equal('not_eligible');
        });

        it("returns 'not_eligible' for an intersection of two ways with non-parent way specified", function () {
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a'}),
                    'b': iD.Node({id: 'b'}),
                    'c': iD.Node({id: 'c'}),
                    'd': iD.Node({id: 'c'}),
                    '*': iD.Node({id: '*'}),
                    '-': iD.Way({id: '-', nodes: ['a', '*', 'b']}),
                    '|': iD.Way({id: '|', nodes: ['c', '*', 'd']})
            });

            expect(iD.actions.Split('*').limitWays(['-', '=']).disabled(graph)).to.equal('not_eligible');
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

        graph = iD.actions.Split('b', ['='])(graph);

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

        graph = iD.actions.Split('b', ['='])(graph);

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

        graph = iD.actions.Split('b', ['='])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b']);
        expect(graph.entity('=').nodes).to.eql(['b', 'c']);
        expect(graph.entity('|').nodes).to.eql(['d', 'b']);
    });

    it("splits multiple ways at an intersection", function () {
        // Situation:
        //           c
        //           |
        //    a ---- * ---- b
        //           ¦
        //           d
        //
        // Split at b.
        //
        // Expected result:
        //           c
        //           |
        //    a ---- * ==== b
        //           ¦
        //           d
        //
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'c'}),
                '*': iD.Node({id: '*'}),
                '-': iD.Way({id: '-', nodes: ['a', '*', 'b']}),
                '|': iD.Way({id: '|', nodes: ['c', '*', 'd']})
        });

        graph = iD.actions.Split('*', ['=', '¦'])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', '*']);
        expect(graph.entity('=').nodes).to.eql(['*', 'b']);
        expect(graph.entity('|').nodes).to.eql(['c', '*']);
        expect(graph.entity('¦').nodes).to.eql(['*', 'd']);
    });

    it("splits the specified ways at an intersection", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'c'}),
                '*': iD.Node({id: '*'}),
                '-': iD.Way({id: '-', nodes: ['a', '*', 'b']}),
                '|': iD.Way({id: '|', nodes: ['c', '*', 'd']})
        });

        var g1 = iD.actions.Split('*', ['=']).limitWays(['-'])(graph);
        expect(g1.entity('-').nodes).to.eql(['a', '*']);
        expect(g1.entity('=').nodes).to.eql(['*', 'b']);
        expect(g1.entity('|').nodes).to.eql(['c', '*', 'd']);

        var g2 = iD.actions.Split('*', ['¦']).limitWays(['|'])(graph);
        expect(g2.entity('-').nodes).to.eql(['a', '*', 'b']);
        expect(g2.entity('|').nodes).to.eql(['c', '*']);
        expect(g2.entity('¦').nodes).to.eql(['*', 'd']);

        var g3 = iD.actions.Split('*', ['=', '¦']).limitWays(['-', '|'])(graph);
        expect(g3.entity('-').nodes).to.eql(['a', '*']);
        expect(g3.entity('=').nodes).to.eql(['*', 'b']);
        expect(g3.entity('|').nodes).to.eql(['c', '*']);
        expect(g3.entity('¦').nodes).to.eql(['*', 'd']);
    });

    it("splits self-intersecting ways", function () {
        // Situation:
        //            b
        //           / |
        //          /  |
        //         c - a -- d
        //
        // Split at a.
        //
        // Expected result:
        //            b
        //           / |
        //          /  |
        //         c - a == d
        //
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'c'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'a', 'd']})
        });

        graph = iD.actions.Split('a', ['='])(graph);

        expect(graph.entity('-').nodes).to.eql(['a', 'b', 'c', 'a']);
        expect(graph.entity('=').nodes).to.eql(['a', 'd']);
    });

    it("splits a closed way at the given point and its antipode", function () {
        // Situation:
        //    a ---- b
        //    |      |
        //    d ---- c
        //
        // Split at a.
        //
        // Expected result:
        //    a ---- b
        //    ||     |
        //    d ==== c
        //
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'd'}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            });

        var g1 = iD.actions.Split('a', ['='])(graph);
        expect(g1.entity('-').nodes).to.eql(['a', 'b', 'c']);
        expect(g1.entity('=').nodes).to.eql(['c', 'd', 'a']);

        var g2 = iD.actions.Split('b', ['='])(graph);
        expect(g2.entity('-').nodes).to.eql(['b', 'c', 'd']);
        expect(g2.entity('=').nodes).to.eql(['d', 'a', 'b']);

        var g3 = iD.actions.Split('c', ['='])(graph);
        expect(g3.entity('-').nodes).to.eql(['c', 'd', 'a']);
        expect(g3.entity('=').nodes).to.eql(['a', 'b', 'c']);

        var g4 = iD.actions.Split('d', ['='])(graph);
        expect(g4.entity('-').nodes).to.eql(['d', 'a', 'b']);
        expect(g4.entity('=').nodes).to.eql(['b', 'c', 'd']);
    });

    it("splits an area by converting it to a multipolygon", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a'}),
                'b': iD.Node({id: 'b'}),
                'c': iD.Node({id: 'c'}),
                'd': iD.Node({id: 'd'}),
                '-': iD.Way({id: '-', tags: {building: 'yes'}, nodes: ['a', 'b', 'c', 'd', 'a']})
            });

        graph = iD.actions.Split('a', ['='])(graph);
        expect(graph.entity('-').tags).to.eql({});
        expect(graph.entity('=').tags).to.eql({});
        expect(graph.parentRelations(graph.entity('-'))).to.have.length(1);

        var relation = graph.parentRelations(graph.entity('-'))[0];
        expect(relation.tags).to.eql({type: 'multipolygon', building: 'yes'});
        expect(relation.members).to.eql([
            {id: '-', role: 'outer', type: 'way'},
            {id: '=', role: 'outer', type: 'way'}
        ]);
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
                'r': iD.Relation({id: 'r', members: [{id: '-', type: 'way', role: 'forward'}]})
            });

        graph = iD.actions.Split('b', ['='])(graph);

        expect(graph.entity('r').members).to.eql([
            {id: '-', type: 'way', role: 'forward'},
            {id: '=', type: 'way', role: 'forward'}
        ]);
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

        graph = iD.actions.Split('b', ['='])(graph);

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

        graph = iD.actions.Split('b', ['='])(graph);

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

        graph = iD.actions.Split('b', ['='])(graph);

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

            graph = iD.actions.Split('b', ['='])(graph);

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

            graph = iD.actions.Split('b', ['='])(graph);

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

            graph = iD.actions.Split('b', ['='])(graph);

            expect(graph.entity('r').members).to.eql([
                {id: '-', role: 'from'},
                {id: '~', role: 'to'},
                {id: 'c', role: 'via'}]);
        });
    });
});
