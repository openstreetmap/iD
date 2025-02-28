describe('iD.actionChangePreset', function() {
    const oldPreset = iD.presetPreset('old', {tags: {old: 'true'}});
    const newPreset = iD.presetPreset('new', {tags: {new: 'true'}});

    it('changes from one preset\'s tags to another\'s', function() {
        const entity = iD.osmNode({tags: {old: 'true'}});
        const graph = iD.coreGraph([entity]);
        const action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({new: 'true'});
    });

    it('adds the tags of a new preset to an entity without an old preset', function() {
        const entity = iD.osmNode();
        const graph = iD.coreGraph([entity]);
        const action = iD.actionChangePreset(entity.id, null, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({new: 'true'});
    });

    it('removes the tags of an old preset from an entity without a new preset', function() {
        const entity = iD.osmNode({tags: {old: 'true'}});
        const graph = iD.coreGraph([entity]);
        const action = iD.actionChangePreset(entity.id, oldPreset, null);
        expect(action(graph).entity(entity.id).tags).to.eql({});
    });

    // https://github.com/openstreetmap/iD/issues/8159
    it('preserves the tags of a new preset\'s addTags', function() {
        const entity = iD.osmNode({tags: {
            'power': 'plant',
            'plant:source': 'coal',
            'plant:method': 'combustion',
            'plant:output:electricity': '10 MW'
        }});
        const graph = iD.coreGraph([entity]);
        const oldPreset = iD.presetPreset('old', {tags: {
            'power': 'plant',
            'plant:source': 'coal'
        }, addTags: {
            'power': 'plant',
            'plant:source': 'coal',
            'plant:method': 'combustion',
            'plant:output:electricity': '*'
        }});
        const newPreset = iD.presetPreset('new', {tags: {
            'power': 'plant',
            'plant:source': 'solar',
            'plant:method': 'photovoltaic'
        }, addTags: {
            'power': 'plant',
            'plant:source': 'solar',
            'plant:method': 'photovoltaic',
            'plant:output:electricity': '*'
        }});
        const action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
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
        const entity = iD.osmNode({tags: {building: 'yes'}});
        const graph = iD.coreGraph([entity]);
        const oldPreset = iD.presetPreset('old', {tags: {building: 'yes'}});
        const newPreset = iD.presetPreset('new', {tags: {amenity: 'school'}, fields: ['field']}, undefined, {
            field: iD.presetField('field', {key: 'building'})
        });
        const action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({amenity: 'school', building: 'yes'});
    });

    it('does not preserves the tags of a non-matching field in the new preset', function() {
        const entity = iD.osmNode({tags: {building: 'yes'}, loc: [0, 0]});
        const graph = iD.coreGraph([entity]);
        const oldPreset = iD.presetPreset('old', {tags: {building: 'yes'}});
        const newPreset = iD.presetPreset('new', {tags: {amenity: 'school'}, fields: ['field']}, undefined, {
            field: iD.presetField('field', {key: 'building', geometry: 'area'})
        });
        const action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({amenity: 'school'});
    });

    // https://github.com/openstreetmap/iD/issues/9372
    it('does not preserve field tags when changing from a subpreset to its parent', function() {
        const entity = iD.osmNode({tags: {highway: 'service', service: 'driveway'}});
        const graph = iD.coreGraph([entity]);
        const oldPreset = iD.presetPreset('highway/service/driveway', {tags: {highway: 'service', service: 'driveway'}});
        const newPreset = iD.presetPreset('highway/service', {tags: {highway: 'service'}, fields: ['field']}, undefined, {
            field: iD.presetField('field', {key: 'service'})
        });
        const action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({highway: 'service'});
    });
});
