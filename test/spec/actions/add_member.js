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

        it('handles incomplete relations', function () {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [0, 0]}),
                iD.osmNode({id: 'c', loc: [0, 0]}),
                iD.osmNode({id: 'd', loc: [0, 0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b', 'c']}),
                iD.osmWay({id: '=', nodes: ['c','d']}),
                iD.osmRelation({id: 'r', members: [
                    {id: '~', type: 'way'},
                    {id: '-', type: 'way'}
                ]})
            ]);

            graph = iD.actionAddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['~', '-', '=']);
        });

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

        it('inserts the member multiple times if insertPair provided (middle)', function() {
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

            var member = { id: '=', type: 'way' };
            var insertPair = {
                originalID: '-',
                insertedID: '=',
                nodes: ['a','b','c']
            };
            graph = iD.actionAddMember('r', member, undefined, insertPair)(graph);
            expect(members(graph)).to.eql(['-', '=', '~', '~', '=', '-']);
        });

        it('inserts the member multiple times if insertPair provided (beginning/end)', function() {
            // Before:         b <=== c ~~~> d <~~~ c ===> b
            // After:   a <--- b <=== c ~~~> d <~~~ c ===> b ---> a
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [0, 0]}),
                iD.osmNode({id: 'c', loc: [0, 0]}),
                iD.osmNode({id: 'd', loc: [0, 0]}),
                iD.osmWay({id: '-', nodes: ['b', 'a']}),
                iD.osmWay({id: '=', nodes: ['c', 'b']}),
                iD.osmWay({id: '~', nodes: ['c', 'd']}),
                iD.osmRelation({id: 'r', members: [
                    {id: '=', type: 'way'},
                    {id: '~', type: 'way'},
                    {id: '~', type: 'way'},
                    {id: '=', type: 'way'}
                ]})
            ]);

            var member = { id: '-', type: 'way' };
            var insertPair = {
                originalID: '=',
                insertedID: '-',
                nodes: ['c','b','a']
            };
            graph = iD.actionAddMember('r', member, undefined, insertPair)(graph);
            expect(members(graph)).to.eql(['-', '=', '~', '~', '=', '-']);
        });

        it('keeps stops and platforms ordered before node, way, relation (for PTv2 routes)', function() {
            var graph = iD.coreGraph([
                iD.osmNode({id: 'a', loc: [0, 0]}),
                iD.osmNode({id: 'b', loc: [0, 0]}),
                iD.osmNode({id: 'c', loc: [0, 0]}),
                iD.osmWay({id: '-', nodes: ['a', 'b']}),
                iD.osmWay({id: '=', nodes: ['b', 'c']}),
                iD.osmRelation({id: 'r', members: [
                    { id: 'n1', type: 'node', role: 'stop' },
                    { id: 'w1', type: 'way', role: 'platform' },
                    { id: 'n2', type: 'node', role: 'stop' },
                    { id: 'w2', type: 'way', role: 'platform' },
                    { id: 'n3', type: 'node', role: 'forward' },
                    { id: 'n4', type: 'node', role: 'forward' },
                    { id: '-', type: 'way', role: 'forward' },
                    { id: 'r1', type: 'relation', role: 'forward' },
                    { id: 'n5', type: 'node', role: 'forward' }
                ]})
            ]);

            graph = iD.actionAddMember('r', { id: '=', type: 'way', role: 'forward' })(graph);
            expect(graph.entity('r').members).to.eql([
                { id: 'n1', type: 'node', role: 'stop' },
                { id: 'w1', type: 'way', role: 'platform' },
                { id: 'n2', type: 'node', role: 'stop' },
                { id: 'w2', type: 'way', role: 'platform' },
                { id: 'n3', type: 'node', role: 'forward' },
                { id: 'n4', type: 'node', role: 'forward' },
                { id: 'n5', type: 'node', role: 'forward' },
                { id: '-', type: 'way', role: 'forward' },
                { id: '=', type: 'way', role: 'forward' },
                { id: 'r1', type: 'relation', role: 'forward' }
            ]);
        });

    });
});
