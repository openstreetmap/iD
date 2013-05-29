describe("iD.actions.ChangePreset", function() {
    var oldPreset = iD.presets.Preset('old', {tags: {old: 'true'}}),
        newPreset = iD.presets.Preset('new', {tags: {new: 'true'}});

    it("changes from one preset's tags to another's", function() {
        var entity = iD.Node({tags: {old: 'true'}}),
            graph = iD.Graph([entity]),
            action = iD.actions.ChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({new: 'true'});
    });

    it("adds the tags of a new preset to an entity without an old preset", function() {
        var entity = iD.Node(),
            graph = iD.Graph([entity]),
            action = iD.actions.ChangePreset(entity.id, null, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({new: 'true'});
    });

    it("removes the tags of an old preset from an entity without a new preset", function() {
        var entity = iD.Node({tags: {old: 'true'}}),
            graph = iD.Graph([entity]),
            action = iD.actions.ChangePreset(entity.id, oldPreset, null);
        expect(action(graph).entity(entity.id).tags).to.eql({});
    });
});
