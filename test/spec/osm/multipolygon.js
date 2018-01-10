describe('iD.osmIsSimpleMultipolygonOuterMember', function() {
    it('returns the parent relation of a simple multipolygon outer', function() {
        var outer = iD.osmWay({tags: {'natural':'wood'}});
        var relation = iD.osmRelation(
            {tags: {type: 'multipolygon'}, members: [{id: outer.id, role: 'outer'}]}
        );
        var graph = iD.coreGraph([outer, relation]);
        expect(iD.osmIsSimpleMultipolygonOuterMember(outer, graph)).to.equal(relation);
    });

    it('returns the parent relation of a simple multipolygon outer, assuming role outer if unspecified', function() {
        var outer = iD.osmWay({tags: {'natural':'wood'}});
        var relation = iD.osmRelation(
            {tags: {type: 'multipolygon'}, members: [{id: outer.id}]}
        );
        var graph = iD.coreGraph([outer, relation]);
        expect(iD.osmIsSimpleMultipolygonOuterMember(outer, graph)).to.equal(relation);
    });

    it('returns false if entity is not a way', function() {
        var outer = iD.osmNode({tags: {'natural':'wood'}});
        var relation = iD.osmRelation(
            {tags: {type: 'multipolygon'}, members: [{id: outer.id, role: 'outer'}]}
        );
        var graph = iD.coreGraph([outer, relation]);
        expect(iD.osmIsSimpleMultipolygonOuterMember(outer, graph)).to.be.false;
    });

    it('returns false if entity does not have interesting tags', function() {
        var outer = iD.osmWay({tags: {'tiger:reviewed':'no'}});
        var relation = iD.osmRelation(
            {tags: {type: 'multipolygon'}, members: [{id: outer.id, role: 'outer'}]}
        );
        var graph = iD.coreGraph([outer, relation]);
        expect(iD.osmIsSimpleMultipolygonOuterMember(outer, graph)).to.be.false;
    });

    it('returns false if entity does not have a parent relation', function() {
        var outer = iD.osmWay({tags: {'natural':'wood'}});
        var graph = iD.coreGraph([outer]);
        expect(iD.osmIsSimpleMultipolygonOuterMember(outer, graph)).to.be.false;
    });

    it('returns false if the parent is not a multipolygon', function() {
        var outer = iD.osmWay({tags: {'natural':'wood'}});
        var relation = iD.osmRelation(
            {tags: {type: 'route'}, members: [{id: outer.id, role: 'outer'}]}
        );
        var graph = iD.coreGraph([outer, relation]);
        expect(iD.osmIsSimpleMultipolygonOuterMember(outer, graph)).to.be.false;
    });

    it('returns false if the parent has interesting tags', function() {
        var outer = iD.osmWay({tags: {'natural':'wood'}});
        var relation = iD.osmRelation(
            {tags: {natural: 'wood', type: 'multipolygon'}, members: [{id: outer.id, role: 'outer'}]}
        );
        var graph = iD.coreGraph([outer, relation]);
        expect(iD.osmIsSimpleMultipolygonOuterMember(outer, graph)).to.be.false;
    });

    it('returns the parent relation of a simple multipolygon outer, ignoring uninteresting parent tags', function() {
        var outer = iD.osmWay({tags: {'natural':'wood'}});
        var relation = iD.osmRelation(
            {tags: {'tiger:reviewed':'no', type: 'multipolygon'}, members: [{id: outer.id, role: 'outer'}]}
        );
        var graph = iD.coreGraph([outer, relation]);
        expect(iD.osmIsSimpleMultipolygonOuterMember(outer, graph)).to.equal(relation);
    });

    it('returns false if the parent has multiple outer ways', function() {
        var outer1 = iD.osmWay({tags: {'natural':'wood'}});
        var outer2 = iD.osmWay({tags: {'natural':'wood'}});
        var relation = iD.osmRelation(
            {tags: {type: 'multipolygon'}, members: [{id: outer1.id, role: 'outer'}, {id: outer2.id, role: 'outer'}]}
        );
        var graph = iD.coreGraph([outer1, outer2, relation]);
        expect(iD.osmIsSimpleMultipolygonOuterMember(outer1, graph)).to.be.false;
        expect(iD.osmIsSimpleMultipolygonOuterMember(outer2, graph)).to.be.false;
    });

    it('returns false if the parent has multiple outer ways, assuming role outer if unspecified', function() {
        var outer1 = iD.osmWay({tags: {'natural':'wood'}});
        var outer2 = iD.osmWay({tags: {'natural':'wood'}});
        var relation = iD.osmRelation(
            {tags: {type: 'multipolygon'}, members: [{id: outer1.id}, {id: outer2.id}]}
        );
        var graph = iD.coreGraph([outer1, outer2, relation]);
        expect(iD.osmIsSimpleMultipolygonOuterMember(outer1, graph)).to.be.false;
        expect(iD.osmIsSimpleMultipolygonOuterMember(outer2, graph)).to.be.false;
    });

    it('returns false if the entity is not an outer', function() {
        var inner = iD.osmWay({tags: {'natural':'wood'}});
        var relation = iD.osmRelation(
            {tags: {type: 'multipolygon'}, members: [{id: inner.id, role: 'inner'}]}
        );
        var graph = iD.coreGraph([inner, relation]);
        expect(iD.osmIsSimpleMultipolygonOuterMember(inner, graph)).to.be.false;
    });
});


describe('iD.osmSimpleMultipolygonOuterMember', function() {
    it('returns the outer member of a simple multipolygon', function() {
        var inner = iD.osmWay();
        var outer = iD.osmWay({tags: {'natural':'wood'}});
        var relation = iD.osmRelation({tags: {type: 'multipolygon'}, members: [
            {id: outer.id, role: 'outer'},
            {id: inner.id, role: 'inner'}]
        });
        var graph = iD.coreGraph([inner, outer, relation]);

        expect(iD.osmSimpleMultipolygonOuterMember(inner, graph)).to.equal(outer);
        expect(iD.osmSimpleMultipolygonOuterMember(outer, graph)).to.equal(outer);
    });

    it('returns falsy for a complex multipolygon', function() {
        var inner = iD.osmWay();
        var outer1 = iD.osmWay({tags: {'natural':'wood'}});
        var outer2 = iD.osmWay({tags: {'natural':'wood'}});
        var relation = iD.osmRelation({tags: {type: 'multipolygon'}, members: [
            {id: outer1.id, role: 'outer'},
            {id: outer2.id, role: 'outer'},
            {id: inner.id, role: 'inner'}]
        });
        var graph = iD.coreGraph([inner, outer1, outer2, relation]);

        expect(iD.osmSimpleMultipolygonOuterMember(inner, graph)).not.to.be.ok;
        expect(iD.osmSimpleMultipolygonOuterMember(outer1, graph)).not.to.be.ok;
        expect(iD.osmSimpleMultipolygonOuterMember(outer2, graph)).not.to.be.ok;
    });

    it('handles incomplete relations', function() {
        var way = iD.osmWay({id: 'w'});
        var relation = iD.osmRelation({id: 'r', tags: {type: 'multipolygon'}, members: [
            {id: 'o', role: 'outer'},
            {id: 'w', role: 'inner'}]
        });
        var graph = iD.coreGraph([way, relation]);

        expect(iD.osmSimpleMultipolygonOuterMember(way, graph)).not.to.be.ok;
    });
});


describe('iD.osmJoinWays', function() {
    it('returns an array of members with nodes properties', function() {
        var node = iD.osmNode({loc: [0, 0]});
        var way  = iD.osmWay({nodes: [node.id]});
        var member = {id: way.id, type: 'way'};
        var graph = iD.coreGraph([node, way]);
        var result = iD.osmJoinWays([member], graph);

        expect(result.length).to.equal(1);
        expect(result[0].nodes.length).to.equal(1);
        expect(result[0].nodes[0]).to.equal(node);
        expect(result[0].length).to.equal(1);
        expect(result[0][0]).to.equal(member);
    });

    it('returns the members in the correct order', function() {
        // a <=== b ---> c ~~~> d
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0, 0]}),
            iD.osmNode({id: 'b', loc: [0, 0]}),
            iD.osmNode({id: 'c', loc: [0, 0]}),
            iD.osmNode({id: 'd', loc: [0, 0]}),
            iD.osmWay({id: '=', nodes: ['b', 'a']}),
            iD.osmWay({id: '-', nodes: ['b', 'c']}),
            iD.osmWay({id: '~', nodes: ['c', 'd']}),
            iD.osmRelation({id: 'r', members: [
                {id: '-', type: 'way'},
                {id: '~', type: 'way'},
                {id: '=', type: 'way'}
            ]})
        ]);

        var result = iD.osmJoinWays(graph.entity('r').members, graph);
        var ids = result[0].map(function (w) { return w.id; });
        expect(ids).to.have.ordered.members(['=', '-', '~']);
    });

    it('reverses member tags of reversed segements', function() {
        // a --> b <== c
        // Expected result:
        // a --> b --> c
        // tags on === reversed
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a'}),
            iD.osmNode({id: 'b'}),
            iD.osmNode({id: 'c'}),
            iD.osmWay({id: '-', nodes: ['a', 'b']}),
            iD.osmWay({id: '=', nodes: ['c', 'b'], tags: {'oneway': 'yes', 'lanes:forward': 2}})
        ]);

        var result = iD.osmJoinWays([graph.entity('-'), graph.entity('=')], graph);
        expect(result[0][1].tags).to.eql({'oneway': '-1', 'lanes:backward': 2});
    });

    it('ignores non-way members', function() {
        var node = iD.osmNode({loc: [0, 0]});
        var member = {id: 'n', type: 'node'};
        var graph = iD.coreGraph([node]);
        expect(iD.osmJoinWays([member], graph)).to.eql([]);
    });

    it('ignores incomplete members', function() {
        var member = {id: 'w', type: 'way'};
        var graph = iD.coreGraph();
        expect(iD.osmJoinWays([member], graph)).to.eql([]);
    });

    it('understands doubled-back relation members', function() {
        //                  e
        //                /   \
        // a <=== b ---> c ~~~> d
        var graph = iD.coreGraph([
            iD.osmNode({id: 'a', loc: [0, 0]}),
            iD.osmNode({id: 'b', loc: [0, 0]}),
            iD.osmNode({id: 'c', loc: [0, 0]}),
            iD.osmNode({id: 'd', loc: [0, 0]}),
            iD.osmNode({id: 'e', loc: [0, 0]}),
            iD.osmWay({id: '=', nodes: ['b', 'a']}),
            iD.osmWay({id: '-', nodes: ['b', 'c']}),
            iD.osmWay({id: '~', nodes: ['c', 'd']}),
            iD.osmWay({id: '\\', nodes: ['d', 'e']}),
            iD.osmWay({id: '/', nodes: ['c', 'e']}),
            iD.osmRelation({id: 'r', members: [
                {id: '=', type: 'way'},
                {id: '-', type: 'way'},
                {id: '~', type: 'way'},
                {id: '\\', type: 'way'},
                {id: '/', type: 'way'},
                {id: '-', type: 'way'},
                {id: '=', type: 'way'}
            ]})
        ]);

        var result = iD.osmJoinWays(graph.entity('r').members, graph);
        var ids = result[0].map(function (w) { return w.id; });
        expect(ids).to.have.ordered.members(['=', '-', '~', '\\', '/', '-', '=']);
    });

});
