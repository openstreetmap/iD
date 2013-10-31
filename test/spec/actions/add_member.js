describe("iD.actions.AddMember", function() {
    it("adds an member to a relation at the specified index", function() {
        var r = iD.Relation({members: [{id: '1'}, {id: '3'}]}),
            g = iD.actions.AddMember(r.id, {id: '2'}, 1)(iD.Graph([r]));
        expect(g.entity(r.id).members).to.eql([{id: '1'}, {id: '2'}, {id: '3'}]);
    });

    describe("inserts way members at a sensible index", function() {
        function members(graph) {
            return _.pluck(graph.entity('r').members, 'id');
        }

        specify("no members", function() {
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [0, 0]}),
                iD.Way({id: '-', nodes: ['a', 'b']}),
                iD.Relation({id: 'r'})
            ]);

            graph = iD.actions.AddMember('r', {id: '-', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-']);
        });

        specify("not connecting", function() {
            // a--->b    c===>d
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [0, 0]}),
                iD.Node({id: 'c', loc: [0, 0]}),
                iD.Node({id: 'd', loc: [0, 0]}),
                iD.Way({id: '-', nodes: ['a', 'b']}),
                iD.Way({id: '=', nodes: ['c', 'd']}),
                iD.Relation({id: 'r', members: [{id: '-', type: 'way'}]})
            ]);

            graph = iD.actions.AddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-', '=']);
        });

        specify("connecting at end", function() {
            // a--->b===>c
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [0, 0]}),
                iD.Node({id: 'c', loc: [0, 0]}),
                iD.Way({id: '-', nodes: ['a', 'b']}),
                iD.Way({id: '=', nodes: ['b', 'c']}),
                iD.Relation({id: 'r', members: [{id: '-', type: 'way'}]})
            ]);

            graph = iD.actions.AddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-', '=']);
        });

        specify("connecting at beginning", function() {
            // a===>b--->c~~~>d
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [0, 0]}),
                iD.Node({id: 'c', loc: [0, 0]}),
                iD.Node({id: 'd', loc: [0, 0]}),
                iD.Way({id: '=', nodes: ['a', 'b']}),
                iD.Way({id: '-', nodes: ['b', 'c']}),
                iD.Way({id: '~', nodes: ['c', 'd']}),
                iD.Relation({id: 'r', members: [{id: '-', type: 'way'}, {id: '~', type: 'way'}]})
            ]);

            graph = iD.actions.AddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['=', '-', '~']);
        });

        specify("connecting in middle", function() {
            // a--->b===>c~~~>d
            var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [0, 0]}),
                iD.Node({id: 'c', loc: [0, 0]}),
                iD.Node({id: 'd', loc: [0, 0]}),
                iD.Way({id: '-', nodes: ['a', 'b']}),
                iD.Way({id: '=', nodes: ['b', 'c']}),
                iD.Way({id: '~', nodes: ['c', 'd']}),
                iD.Relation({id: 'r', members: [{id: '-', type: 'way'}, {id: '~', type: 'way'}]})
            ]);

            graph = iD.actions.AddMember('r', {id: '=', type: 'way'})(graph);
            expect(members(graph)).to.eql(['-', '=', '~']);
        });
    });
});
