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

    // https://github.com/openstreetmap/iD/issues/8159
    it('preserves the tags of a new preset\'s addTags', function() {
        var entity = iD.osmNode({tags: {
            'power': 'plant',
            'plant:source': 'coal',
            'plant:method': 'combustion',
            'plant:output:electricity': '10 MW'
        }});
        var graph = iD.coreGraph([entity]);
        var oldPreset = iD.presetPreset('old', {tags: {
            'power': 'plant',
            'plant:source': 'coal'
        }, addTags: {
            'power': 'plant',
            'plant:source': 'coal',
            'plant:method': 'combustion',
            'plant:output:electricity': '*'
        }});
        var newPreset = iD.presetPreset('new', {tags: {
            'power': 'plant',
            'plant:source': 'solar',
            'plant:method': 'photovoltaic'
        }, addTags: {
            'power': 'plant',
            'plant:source': 'solar',
            'plant:method': 'photovoltaic',
            'plant:output:electricity': '*'
        }});
        var action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({
            'power': 'plant',
            'plant:source': 'solar',
            'plant:method': 'photovoltaic',
            'plant:output:electricity': '10 MW'
        });
    });

    // https://github.com/openstreetmap/iD/issues/9341
    // https://github.com/openstreetmap/iD/issues/9104
    it('preserves the tags when there is a matching field in the new preset', function() {
        var entity = iD.osmNode({tags: {building: 'yes'}});
        var graph = iD.coreGraph([entity]);
        var oldPreset = iD.presetPreset('old', {tags: {building: 'yes'}});
        var newPreset = iD.presetPreset('new', {tags: {amenity: 'school'}, fields: ['field']}, undefined, {
            field: iD.presetField('field', {key: 'building'})
        });
        var action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({amenity: 'school', building: 'yes'});
    });

    it('does not preserves the tags of a non-matching field in the new preset', function() {
        var entity = iD.osmNode({tags: {building: 'yes'}, loc: [0, 0]});
        var graph = iD.coreGraph([entity]);
        var oldPreset = iD.presetPreset('old', {tags: {building: 'yes'}});
        var newPreset = iD.presetPreset('new', {tags: {amenity: 'school'}, fields: ['field']}, undefined, {
            field: iD.presetField('field', {key: 'building', geometry: 'area'})
        });
        var action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({amenity: 'school'});
    });

    // https://github.com/openstreetmap/iD/issues/9372
    it('does not preserve field tags when changing from a subpreset to its parent', function() {
        var entity = iD.osmNode({tags: {highway: 'service', service: 'driveway'}});
        var graph = iD.coreGraph([entity]);
        var oldPreset = iD.presetPreset('highway/service/driveway', {tags: {highway: 'service', service: 'driveway'}});
        var newPreset = iD.presetPreset('highway/service', {tags: {highway: 'service'}, fields: ['field']}, undefined, {
            field: iD.presetField('field', {key: 'service'})
        });
        var action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({highway: 'service'});
    });
});
