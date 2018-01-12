describe('iD.actionAddMember', function() {
    it('adds an member to a relation at the specified index', function() {
        var r = iD.osmRelation({members: [{id: '1'}, {id: '3'}]});
        var g = iD.actionAddMember(r.id, {id: '2'}, 1)(iD.coreGraph([r]));
        expect(g.entity(r.id).members).to.eql([{id: '1'}, {id: '2'}, {id: '3'}]);
    });

    describe('inserts way members at a sensible index', function() {
        function members(graph) {
            return graph.entity('r').members.map(function (m) { return m.id; });
        }

        it('adds the member to a relation with no members', function() {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [0, 0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmRelation({id: 'r'})
            ]);

            graph = iD.actionAddMember('r', {id: '-', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-']);
        });

        it('appends the member if the ways are not connecting', function() {
            // Before:  a ---> b
            // After:   a ---> b .. c ===> d
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [0, 0]}),
                iD.osmNode({id: 'c', loc: [0, 0]}),
                iD.osmNode({id: 'd', loc: [0, 0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['c', 'd']}),
                iD.osmRelation({id: 'r', members: [
                    {id: '-', type: 'way'}
                ]})
            ]);

            graph = iD.actionAddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-', '=']);
        });

        it('appends the member if the way connects at end', function() {
            // Before:   a ---> b
            // After:    a ---> b ===> c
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [0, 0]}),
                iD.osmNode({id: 'c', loc: [0, 0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']}),
                iD.osmRelation({id: 'r', members: [
                    {id: '-', type: 'way'}
                ]})
            ]);

            graph = iD.actionAddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-', '=']);
        });

        it('inserts the member if the way connects at beginning', function() {
            // Before:          b ---> c ~~~> d
            // After:    a ===> b ---> c ~~~> d
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [0, 0]}),
                iD.osmNode({id: 'c', loc: [0, 0]}),
                iD.osmNode({id: 'd', loc: [0, 0]}),
                iD.osmWay({id: '=', nodes: ['a', 'b']}),
                iD.osmWay({id: '-', nodes: ['b', 'c']}),
                iD.osmWay({id: '~', nodes: ['c', 'd']}),
                iD.osmRelation({id: 'r', members: [
                    {id: '-', type: 'way'},
                    {id: '~', type: 'way'}
                ]})
            ]);

            graph = iD.actionAddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['=', '-', '~']);
        });

        it('inserts the member if the way connects in middle', function() {
            // Before:  a ---> b  ..  c ~~~> d
            // After:   a ---> b ===> c ~~~> d
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [0, 0]}),
                iD.osmNode({id: 'c', loc: [0, 0]}),
                iD.osmNode({id: 'd', loc: [0, 0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']}),
                iD.osmWay({id: '~', nodes: ['c', 'd']}),
                iD.osmRelation({id: 'r', members: [
                    {id: '-', type: 'way'},
                    {id: '~', type: 'way'}
                ]})
            ]);

            graph = iD.actionAddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-', '=', '~']);
        });

        it('inserts the member multiple times if the way exists multiple times (middle)', function() {
            // Before:  a ---> b  ..  c ~~~> d <~~~ c  ..  b <--- a
            // After:   a ---> b ===> c ~~~> d <~~~ c <=== b <--- a
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [0, 0]}),
                iD.osmNode({id: 'c', loc: [0, 0]}),
                iD.osmNode({id: 'd', loc: [0, 0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']}),
                iD.osmWay({id: '~', nodes: ['c', 'd']}),
                iD.osmRelation({id: 'r', members: [
                    {id: '-', type: 'way'},
                    {id: '~', type: 'way'},
                    {id: '~', type: 'way'},
                    {id: '-', type: 'way'}
                ]})
            ]);

            graph = iD.actionAddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-', '=', '~', '~', '=', '-']);
        });

        it('inserts the member multiple times if the way exists multiple times (beginning/end)', function() {
            // Before:         b ===> c ~~~> d <~~~ c <=== b
            // After:   a ---> b ===> c ~~~> d <~~~ c <=== b <--- a
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [0, 0]}),
                iD.osmNode({id: 'c', loc: [0, 0]}),
                iD.osmNode({id: 'd', loc: [0, 0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']}),
                iD.osmWay({id: '~', nodes: ['c', 'd']}),
                iD.osmRelation({id: 'r', members: [
                    {id: '=', type: 'way'},
                    {id: '~', type: 'way'},
                    {id: '~', type: 'way'},
                    {id: '=', type: 'way'}
                ]})
            ]);

            graph = iD.actionAddMember('r', {id: '-', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-', '=', '~', '~', '=', '-']);
        });


    });
});
