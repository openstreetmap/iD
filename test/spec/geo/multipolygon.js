describe("iD.geo.simpleMultipolygonOuterMember", function() {
    it("returns the outer member of a simple multipolygon", function() {
        var inner = iD.Way(),
            outer = iD.Way(),
            relation = iD.Relation({tags: {type: 'multipolygon'}, members: [
                {id: outer.id, role: 'outer'},
                {id: inner.id, role: 'inner'}]
            }),
            graph = iD.Graph([inner, outer, relation]);

        expect(iD.geo.simpleMultipolygonOuterMember(inner, graph)).to.equal(outer);
        expect(iD.geo.simpleMultipolygonOuterMember(outer, graph)).to.equal(outer);
    });

    it("returns falsy for a complex multipolygon", function() {
        var inner = iD.Way(),
            outer1 = iD.Way(),
            outer2 = iD.Way(),
            relation = iD.Relation({tags: {type: 'multipolygon'}, members: [
                {id: outer1.id, role: 'outer'},
                {id: outer2.id, role: 'outer'},
                {id: inner.id, role: 'inner'}]
            }),
            graph = iD.Graph([inner, outer1, outer2, relation]);

        expect(iD.geo.simpleMultipolygonOuterMember(inner, graph)).not.to.be.ok;
        expect(iD.geo.simpleMultipolygonOuterMember(outer1, graph)).not.to.be.ok;
        expect(iD.geo.simpleMultipolygonOuterMember(outer2, graph)).not.to.be.ok;
    });

    it("handles incomplete relations", function() {
        var way = iD.Way({id: 'w'}),
            relation = iD.Relation({id: 'r', tags: {type: 'multipolygon'}, members: [
                {id: 'o', role: 'outer'},
                {id: 'w', role: 'inner'}]
            }),
            graph = iD.Graph([way, relation]);

        expect(iD.geo.simpleMultipolygonOuterMember(way, graph)).to.be.undefined;
    });
});

describe("iD.geo.joinWays", function() {
    it("returns an array of members with nodes properties", function() {
        var node = iD.Node({loc: [0, 0]}),
            way  = iD.Way({nodes: [node.id]}),
            member = {id: way.id, type: 'way'},
            graph = iD.Graph([node, way]),
            result = iD.geo.joinWays([member], graph);

        expect(result.length).to.equal(1);
        expect(result[0].nodes.length).to.equal(1);
        expect(result[0].nodes[0]).to.equal(node);
        expect(result[0].length).to.equal(1);
        expect(result[0][0]).to.equal(member);
    });

    it("returns the members in the correct order", function() {
        // a<===b--->c~~~>d
        var graph = iD.Graph([
            iD.Node({id: 'a', loc: [0, 0]}),
            iD.Node({id: 'b', loc: [0, 0]}),
            iD.Node({id: 'c', loc: [0, 0]}),
            iD.Node({id: 'd', loc: [0, 0]}),
            iD.Way({id: '=', nodes: ['b', 'a']}),
            iD.Way({id: '-', nodes: ['b', 'c']}),
            iD.Way({id: '~', nodes: ['c', 'd']}),
            iD.Relation({id: 'r', members: [
                {id: '-', type: 'way'},
                {id: '~', type: 'way'},
                {id: '=', type: 'way'}
            ]})
        ]);

        var result = iD.geo.joinWays(graph.entity('r').members, graph);
        expect(_.pluck(result[0], 'id')).to.eql(['=', '-', '~']);
    });

    it("reverses member tags of reversed segements", function() {
        // a --> b <== c
        // Expected result:
        // a --> b --> c
        // tags on === reversed
        var graph = iD.Graph([
                iD.Node({id: 'a'}),
                iD.Node({id: 'b'}),
                iD.Node({id: 'c'}),
                iD.Way({id: '-', nodes: ['a', 'b']}),
                iD.Way({id: '=', nodes: ['c', 'b'], tags: {'oneway': 'yes', 'lanes:forward': 2}})
            ]);

        var result = iD.geo.joinWays([graph.entity('-'), graph.entity('=')], graph);
        expect(result[0][1].tags).to.eql({'oneway': '-1', 'lanes:backward': 2});
    });

    it("ignores non-way members", function() {
        var node = iD.Node({loc: [0, 0]}),
            member = {id: 'n', type: 'node'},
            graph = iD.Graph([node]);
        expect(iD.geo.joinWays([member], graph)).to.eql([]);
    });

    it("ignores incomplete members", function() {
        var member = {id: 'w', type: 'way'},
            graph = iD.Graph();
        expect(iD.geo.joinWays([member], graph)).to.eql([]);
    });
});
