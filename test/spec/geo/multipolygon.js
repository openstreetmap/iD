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
