describe("iD.svg.Restrictions", function() {
    var restrictions = iD.svg.Restrictions({});

    describe("#turns", function() {
        it("returns an empty array with no selection", function() {
            var graph = iD.Graph();
            expect(restrictions.turns(graph, [])).to.eql([]);
        });

        it("returns an empty array with a multiselection", function() {
            var graph = iD.Graph();
            expect(restrictions.turns(graph, ['a', 'b'])).to.eql([]);
        });

        var valid = iD.Graph({
            'u': iD.Node({id: 'u'}),
            'v': iD.Node({id: 'v'}),
            'w': iD.Node({id: 'w'}),
            'f': iD.Way({id: 'f', nodes: ['u', 'v']}),
            't': iD.Way({id: 't', nodes: ['v', 'w']}),
            'r': iD.Relation({id: 'r', tags: {type: 'restriction'}, members: [
                { role: 'via',  id: 'v', type: 'node' },
                { role: 'from', id: 'f', type: 'way' },
                { role: 'to',   id: 't', type: 'way' }
            ]})
        });

        it("returns a valid restriction when the selected way has role 'from'", function() {
            expect(restrictions.turns(valid, ['f'])).to.eql([valid.entity('r')]);
        });

        it("returns an empty array when the selected way has role 'to'", function() {
            expect(restrictions.turns(valid, ['t'])).to.eql([]);
        });

        it("ignores restrictions missing a 'to' role", function() {
            var graph = valid.replace(valid.entity('r').removeMembersWithID('t'));
            expect(restrictions.turns(graph, ['f'])).to.eql([]);
        });

        it("ignores restrictions with an incomplete 'to' role", function() {
            var graph = valid.remove(valid.entity('t'));
            expect(restrictions.turns(graph, ['f'])).to.eql([]);
        });

        it("ignores restrictions missing a 'via' role", function() {
            var graph = valid.replace(valid.entity('r').removeMembersWithID('v'));
            expect(restrictions.turns(graph, ['f'])).to.eql([]);
        });

        it("ignores restrictions with an incomplete 'via' role", function() {
            var graph = valid.remove(valid.entity('v'));
            expect(restrictions.turns(graph, ['f'])).to.eql([]);
        });

        it("ignores restrictions whose 'from' role is not a way", function() {
            var graph = valid.replace(iD.Node({id: 'f2'}))
                .replace(valid.entity('r').replaceMember({id: 'f'}, {id: 'f2', type: 'node'}));
            expect(restrictions.turns(graph, ['f2'])).to.eql([]);
        });

        it("ignores restrictions whose 'to' role is not a way", function() {
            var graph = valid.replace(iD.Node({id: 't2'}))
                .replace(valid.entity('r').replaceMember({id: 't'}, {id: 't2', type: 'node'}));
            expect(restrictions.turns(graph, ['f'])).to.eql([]);
        });

        it("ignores restrictions whose 'via' role is not a node", function() {
            var graph = valid.replace(iD.Way({id: 'v2'}))
                .replace(valid.entity('r').replaceMember({id: 'v'}, {id: 'v2', type: 'way'}));
            expect(restrictions.turns(graph, ['f'])).to.eql([]);
        });

        it("ignores restrictions whose 'from' role does not start or end with the via node", function() {
            var graph = valid.replace(valid.entity('f').update({nodes: ['o']}));
            expect(restrictions.turns(graph, ['f'])).to.eql([]);
        });

        it("ignores restrictions whose 'to' role does not start or end with the via node", function() {
            var graph = valid.replace(valid.entity('t').update({nodes: ['o']}));
            expect(restrictions.turns(graph, ['f'])).to.eql([]);
        });

        it("ignores restrictions whose 'from' role has less than two nodes", function() {
            var graph = valid.replace(valid.entity('f').update({nodes: ['v']}));
            expect(restrictions.turns(graph, ['f'])).to.eql([]);
        });

        it("ignores restrictions whose 'to' role has less than two nodes", function() {
            var graph = valid.replace(valid.entity('t').update({nodes: ['v']}));
            expect(restrictions.turns(graph, ['f'])).to.eql([]);
        });

        it("ignores restriction subtypes", function() {
            var graph = valid.replace(valid.entity('r').update({tags: {type: 'restriction:hgv'}}));
            expect(restrictions.turns(graph, ['f'])).to.eql([]);
        });
    });

    describe("#datum", function() {
        function projection(x) { return x; }

        it("calculates the angle of a forward 'to' role", function() {
            //       w---x--->y
            //       |
            // u====>v
            // From = to - via v

            var graph = iD.Graph({
                'u': iD.Node({id: 'u', loc: [0, 0]}),
                'v': iD.Node({id: 'v', loc: [1, 0]}),
                'w': iD.Node({id: 'w', loc: [1, 1]}),
                'x': iD.Node({id: 'w', loc: [2, 1]}),
                'y': iD.Node({id: 'w', loc: [3, 1]}),
                '=': iD.Way({id: '=', nodes: ['u', 'v']}),
                '-': iD.Way({id: '-', nodes: ['v', 'w', 'x', 'y']}),
                'r': iD.Relation({id: 'r', tags: {type: 'restriction'}, members: [
                    { role: 'via',  id: 'v', type: 'node' },
                    { role: 'from', id: '=', type: 'way' },
                    { role: 'to',   id: '-', type: 'way' }
                ]})
            });

            expect(restrictions.datum(graph, graph.entity('='), graph.entity('r'), projection).angle).to.eql(Math.PI / 2);
        });

        it("calculates the angle of a reverse 'to' role", function() {
            //       w<---x---y
            //       |
            // u====>v
            // From = to - via v

            var graph = iD.Graph({
                'u': iD.Node({id: 'u', loc: [0, 0]}),
                'v': iD.Node({id: 'v', loc: [1, 0]}),
                'w': iD.Node({id: 'w', loc: [1, 1]}),
                'x': iD.Node({id: 'w', loc: [2, 1]}),
                'y': iD.Node({id: 'w', loc: [3, 1]}),
                '=': iD.Way({id: '=', nodes: ['u', 'v']}),
                '-': iD.Way({id: '-', nodes: ['y', 'x', 'w', 'v']}),
                'r': iD.Relation({id: 'r', tags: {type: 'restriction'}, members: [
                    { role: 'via',  id: 'v', type: 'node' },
                    { role: 'from', id: '=', type: 'way' },
                    { role: 'to',   id: '-', type: 'way' }
                ]})
            });

            expect(restrictions.datum(graph, graph.entity('='), graph.entity('r'), projection).angle).to.eql(Math.PI / 2);
        });
    });
});
