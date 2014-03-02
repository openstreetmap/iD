describe("iD.actions.DiscardTags", function() {
    it("discards obsolete tags from modified entities", function() {
        var way    = iD.Way({id: 'w1', tags: {created_by: 'Potlatch'}}),
            base   = iD.Graph([way]),
            head   = base.replace(way.update({tags: {created_by: 'Potlatch', foo: 'bar'}})),
            action = iD.actions.DiscardTags(iD.Difference(base, head));
        expect(action(head).entity(way.id).tags).to.eql({foo: 'bar'});
    });

    it("discards obsolete tags from created entities", function() {
        var way    = iD.Way({tags: {created_by: 'Potlatch'}}),
            base   = iD.Graph(),
            head   = base.replace(way),
            action = iD.actions.DiscardTags(iD.Difference(base, head));
        expect(action(head).entity(way.id).tags).to.eql({});
    });

    it("doesn't modify entities without obsolete tags", function() {
        var way    = iD.Way(),
            base   = iD.Graph(),
            head   = base.replace(way),
            action = iD.actions.DiscardTags(iD.Difference(base, head));
        expect(action(head).entity(way.id)).to.equal(way);
    });

    it("discards tags with empty values", function() {
        var way    = iD.Way({tags: {lmnop: ''}}),
            base   = iD.Graph(),
            head   = base.replace(way),
            action = iD.actions.DiscardTags(iD.Difference(base, head));
        expect(action(head).entity(way.id).tags).to.eql({});
    });
});
