describe('iD.actionDiscardTags', function() {
    const discardTags = { created_by: true, attribution: { 'https://example.com': true } };

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

    it('discards obsolete key-value pairs', () => {
        const way = iD.osmWay({ id: 'w1', tags: { attribution: 'https://example.com' } });
        const base = iD.coreGraph([way]);
        const head = base.replace(way.update({ tags: { ...way.tags, foo: 'bar' } }));
        const action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).to.eql({ foo: 'bar' });
    });

    it('does not discard tags where the key matches but the value does not match', () => {
        const way = iD.osmWay({ id: 'w1', tags: { attribution: 'some other valid value' } });
        const base = iD.coreGraph([way]);
        const head = base.replace(way.update({ tags: { ...way.tags, foo: 'bar' } }));
        const action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).to.eql({ attribution: 'some other valid value', foo: 'bar' });
    });
});
