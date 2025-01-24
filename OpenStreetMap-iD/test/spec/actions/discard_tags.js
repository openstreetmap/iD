describe('iD.actionDiscardTags', function() {
    var discardTags = { created_by: true };

    it('discards obsolete tags from modified entities', function() {
        var way = iD.osmWay({ id: 'w1', tags: { created_by: 'Potlatch' } });
        var base = iD.coreGraph([way]);
        var head = base.replace(way.update({ tags: { created_by: 'Potlatch', foo: 'bar' } }));
        var action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).to.eql({foo: 'bar'});
    });

    it('discards obsolete tags from created entities', function() {
        var way = iD.osmWay({ tags: { created_by: 'Potlatch' } });
        var base = iD.coreGraph();
        var head = base.replace(way);
        var action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).to.eql({});
    });

    it('doesn\'t modify entities without obsolete tags', function() {
        var way = iD.osmWay();
        var base = iD.coreGraph();
        var head = base.replace(way);
        var action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id)).to.equal(way);
    });

    it('discards tags with empty values', function() {
        var way = iD.osmWay({ tags: { lmnop: '' } });
        var base = iD.coreGraph();
        var head = base.replace(way);
        var action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).to.eql({});
    });
});
