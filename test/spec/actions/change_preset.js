describe('iD.actionChangePreset', function() {
    var oldPreset = iD.presetPreset('old', {tags: {old: 'true'}});
    var newPreset = iD.presetPreset('new', {tags: {new: 'true'}});

    it('changes from one preset\'s tags to another\'s', function() {
        var entity = iD.osmNode({tags: {old: 'true'}});
        var graph = iD.coreGraph([entity]);
        var action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({new: 'true'});
    });

    it('adds the tags of a new preset to an entity without an old preset', function() {
        var entity = iD.osmNode();
        var graph = iD.coreGraph([entity]);
        var action = iD.actionChangePreset(entity.id, null, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({new: 'true'});
    });

    it('removes the tags of an old preset from an entity without a new preset', function() {
        var entity = iD.osmNode({tags: {old: 'true'}});
        var graph = iD.coreGraph([entity]);
        var action = iD.actionChangePreset(entity.id, oldPreset, null);
        expect(action(graph).entity(entity.id).tags).to.eql({});
    });
});
