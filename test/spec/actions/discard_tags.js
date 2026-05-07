describe('iD.actionDiscardTags', function() {
    const discardTags = { created_by: true, attribution: { 'https://example.com': true } };

    it('discards obsolete tags from modified entities', function() {
        var way = new iD.osmWay({ id: 'w1', tags: { created_by: 'Potlatch' } });
        var base = new iD.coreGraph([way]);
        var head = base.replace(way.update({ tags: { created_by: 'Potlatch', foo: 'bar' } }));
        var action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).toEqual({foo: 'bar'});
    });

    it('discards obsolete tags from created entities', function() {
        var way = new iD.osmWay({ tags: { created_by: 'Potlatch' } });
        var base = new iD.coreGraph();
        var head = base.replace(way);
        var action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).toEqual({});
    });

    it('doesn\'t modify entities without obsolete tags', function() {
        var way = new iD.osmWay();
        var base = new iD.coreGraph();
        var head = base.replace(way);
        var action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id)).to.equal(way);
    });

    it('discards tags with empty values', function() {
        var way = new iD.osmWay({ tags: { lmnop: '' } });
        var base = new iD.coreGraph();
        var head = base.replace(way);
        var action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).toEqual({});
    });

    it('discards obsolete key-value pairs', () => {
        const way = new iD.osmWay({ id: 'w1', tags: { attribution: 'https://example.com' } });
        const base = new iD.coreGraph([way]);
        const head = base.replace(way.update({ tags: { ...way.tags, foo: 'bar' } }));
        const action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).toEqual({ foo: 'bar' });
    });

    it('does not discard tags where the key matches but the value does not match', () => {
        const way = new iD.osmWay({ id: 'w1', tags: { attribution: 'some other valid value' } });
        const base = new iD.coreGraph([way]);
        const head = base.replace(way.update({ tags: { ...way.tags, foo: 'bar' } }));
        const action = iD.actionDiscardTags(iD.coreDifference(base, head), discardTags);
        expect(action(head).entity(way.id).tags).toEqual({ attribution: 'some other valid value', foo: 'bar' });
    });
});
