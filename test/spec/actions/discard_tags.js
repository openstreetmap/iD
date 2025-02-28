describe('iD.actionDiscardTags', function() {
    const discardTags = { created_by: true };

    it('discards obsolete tags from modified entities', function() {
        const way = iD.osmWay({ id: 'w1', tags: { created_by: 'Potlatch' } });
        const base = iD.coreGraph([way]);
        const head = base.replace(way.update({ tags: { created_by: 'Potlatch', foo: 'bar' } }));
        const action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).to.eql({foo: 'bar'});
    });

    it('discards obsolete tags from created entities', function() {
        const way = iD.osmWay({ tags: { created_by: 'Potlatch' } });
        const base = iD.coreGraph();
        const head = base.replace(way);
        const action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).to.eql({});
    });

    it('doesn\'t modify entities without obsolete tags', function() {
        const way = iD.osmWay();
        const base = iD.coreGraph();
        const head = base.replace(way);
        const action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id)).to.equal(way);
    });

    it('discards tags with empty values', function() {
        const way = iD.osmWay({ tags: { lmnop: '' } });
        const base = iD.coreGraph();
        const head = base.replace(way);
        const action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).to.eql({});
    });
});
