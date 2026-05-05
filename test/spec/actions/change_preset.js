describe('iD.actionChangePreset', function() {
    var oldPreset = iD.presetPreset('old', {tags: {old: 'true'}});
    var newPreset = iD.presetPreset('new', {tags: {new: 'true'}});

    it('changes from one preset\'s tags to another\'s', function() {
        var entity = new iD.osmNode({tags: {old: 'true'}});
        var graph = new iD.coreGraph([entity]);
        var action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({new: 'true'});
    });

    it('adds the tags of a new preset to an entity without an old preset', function() {
        var entity = new iD.osmNode();
        var graph = new iD.coreGraph([entity]);
        var action = iD.actionChangePreset(entity.id, null, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({new: 'true'});
    });

    it('removes the tags of an old preset from an entity without a new preset', function() {
        var entity = new iD.osmNode({tags: {old: 'true'}});
        var graph = new iD.coreGraph([entity]);
        var action = iD.actionChangePreset(entity.id, oldPreset, null);
        expect(action(graph).entity(entity.id).tags).to.eql({});
    });

    it('preserves the tags that are defined in neither preset when changing from one preset to another', function() {
        const entity = new iD.osmNode({tags: {old: 'true', other: 'other'}});
        const graph = new iD.coreGraph([entity]);
        const oldPreset = iD.presetPreset('old', {tags: {old: 'true'}});
        const newPreset = iD.presetPreset('new', {tags: {new: 'true'}});
        const action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({new: 'true', other: 'other'});
    });

    // https://github.com/openstreetmap/iD/issues/8159
    it('preserves the tags of a new preset\'s addTags', function() {
        var entity = new iD.osmNode({tags: {
            'power': 'plant',
            'plant:source': 'coal',
            'plant:method': 'combustion',
            'plant:output:electricity': '10 MW'
        }});
        var graph = new iD.coreGraph([entity]);
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
        var entity = new iD.osmNode({tags: {building: 'yes'}});
        var graph = new iD.coreGraph([entity]);
        var oldPreset = iD.presetPreset('old', {tags: {building: 'yes'}});
        var newPreset = iD.presetPreset('new', {tags: {amenity: 'school'}, fields: ['field']}, undefined, {
            field: iD.presetField('field', {key: 'building'})
        });
        var action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({amenity: 'school', building: 'yes'});
    });

    it('does not preserves the tags of a non-matching field in the new preset', function() {
        var entity = new iD.osmNode({tags: {building: 'yes'}, loc: [0, 0]});
        var graph = new iD.coreGraph([entity]);
        var oldPreset = iD.presetPreset('old', {tags: {building: 'yes'}});
        var newPreset = iD.presetPreset('new', {tags: {amenity: 'school'}, fields: ['field']}, undefined, {
            field: iD.presetField('field', {key: 'building', geometry: 'area'})
        });
        var action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({amenity: 'school'});
    });

    // https://github.com/openstreetmap/iD/pull/11696
    it('does not preserve field tags which only exist in the old preset, not in the new preset', () => {
        const entity = new iD.osmNode({
            tags: {
                building: 'yes', // case 1: the preset's own tags.
                'roof:colour': 'pink', // case 2: a field which exists in the old preset, but not the new one.
                check_date: '2025-12-05', // case 3: a field which exists in the old AND new preset.
                grades: '0-13', // case 4: a field which exists only in the new preset, not in the old one.
                'ref:SG:address_id': '1234', // case 5: a tag which does not exist in either preset
            },
            loc: [0, 0],
        });
        const graph = new iD.coreGraph([entity]);

        const fields = {
            'roof:colour': iD.presetField('roof:colour', { key: 'roof:colour', geometry: 'point' }),
            check_date: iD.presetField('check_date', { key: 'check_date', geometry: 'point' }),
            grades: iD.presetField('roof:colour', { key: 'grades', geometry: 'point' }),
        };

        const oldPreset = iD.presetPreset(
            'building/yes',
            { tags: { building: 'yes' }, fields: ['roof:colour', 'check_date'] },
            undefined,
            fields,
        );
        const newPreset = iD.presetPreset(
            'amenity/school',
            { tags: { amenity: 'school' }, fields: ['check_date', 'grades'] },
            undefined,
            fields,
        );
        const action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).toStrictEqual({
            amenity: 'school', // case 1: the preset's own tags were replaced.
            // case 2: the field which exists in the old preset was removed (roof:colour).
            check_date: '2025-12-05', // case 3: the field which exists in the old AND new preset was kept.
            grades: '0-13', // case 4: a field which exists only in the new preset was also kept.
            'ref:SG:address_id': '1234', // case 5: tags which do not exist in either preset are kept
        });
    });

    it('preserves all tags when re-selecting the same preset', () => {
        const entity = new iD.osmNode({
            tags: {
                building: 'yes', // the preset's own tags.
                'building:colour': 'green', // a field which exists in the preset
                'name': 'The Frog House', // a tag which does not exist in the preset
            },
            loc: [0, 0],
        });
        const graph = new iD.coreGraph([entity]);

        const fields = {
            'building:colour': iD.presetField('building:colour', { key: 'building:colour', geometry: 'point' }),
        };

        const preset = iD.presetPreset(
            'building/yes',
            { tags: { building: 'yes' }, fields: ['building:colour'] },
            undefined,
            fields,
        );
        const action = iD.actionChangePreset(entity.id, preset, preset);
        expect(action(graph).entity(entity.id).tags).toStrictEqual({
            // all tags are preserved
            building: 'yes',
            'building:colour': 'green',
            'name': 'The Frog House',
        });
    });

    // https://github.com/openstreetmap/iD/issues/12075
    it.each([{
        fieldType: 'multiCombo',
        fieldId: 'recycling',
        fieldKey: 'recycling:',
        fieldKeys: [],
        oldTags: { 'recycling:paper': 'yes', 'recycling:others': 'no' },
        tagsToPreserve: {}
    }, {
        fieldType: 'localized',
        fieldId: 'name',
        fieldKey: 'name',
        fieldKeys: [],
        oldTags: { 'name': 'foo', 'name:en': 'bar', 'name:etymology:wikidata': 'Q860' },
        tagsToPreserve: { 'name:etymology:wikidata': 'Q860' }
    }, {
        fieldType: 'directionalCombo',
        fieldId: 'cycleway',
        fieldKey: 'cycleway',
        fieldKeys: [ 'cycleway:left', 'cycleway:right' ],
        oldTags: { 'cycleway:left': 'no', 'cycleway:both': 'separate', 'cycleway:foo': 'bar' },
        tagsToPreserve: { 'cycleway:foo': 'bar' }
    }])('does not preserve $fieldType field tags that are only present in the old preset', ({
        fieldType, fieldId, fieldKey, fieldKeys, oldTags, tagsToPreserve
    }) => {
        const entity = iD.osmNode({
            tags: {
                amenity: 'recycling',
                ...oldTags,
                unrelatedTagKey: 'unrelatedTagValue',
            },
            loc: [0, 0],
        });
        const graph = new iD.coreGraph([entity]);

        const fields = {
            [fieldId]: iD.presetField('recycling', { type: fieldType, key: fieldKey, keys: fieldKeys }),
        };

        const oldPreset = iD.presetPreset(
            'amenity/recycling',
            { tags: { amenity: 'recycling' }, fields: [fieldId] },
            undefined,
            fields,
        );
        const newPreset = iD.presetPreset(
            'amenity/bench',
            { tags: { amenity: 'bench' }, fields: [] },
            undefined,
            fields,
        );
        const action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).toStrictEqual({
            // no field tags are preserved
            amenity: 'bench',
            ...tagsToPreserve,
            unrelatedTagKey: 'unrelatedTagValue',
        });
    });

    // https://github.com/openstreetmap/iD/pull/12218#issuecomment-4314204446
    it.each([{
        fieldType: 'multiCombo',
        fieldId: 'recycling',
        fieldKey: 'recycling:',
        fieldKeys: [],
        oldTags: { 'recycling:paper': 'yes', 'recycling:others': 'no' }
    }, {
        fieldType: 'localized',
        fieldId: 'name',
        fieldKey: 'name',
        fieldKeys: [],
        oldTags: { 'name': 'foo', 'name:en': 'bar', 'name:etymology:wikidata': 'Q860' }
    }, {
        fieldType: 'directionalCombo',
        fieldId: 'cycleway',
        fieldKey: 'cycleway',
        fieldKeys: [ 'cycleway:left', 'cycleway:right' ],
        oldTags: { 'cycleway:left': 'no', 'cycleway:both': 'separate', 'cycleway:foo': 'bar' }
    }])('preserve $fieldType field tags when they are present in the old and the new preset', ({
        fieldType, fieldId, fieldKey, fieldKeys, oldTags
    }) => {
        const entity = iD.osmNode({
            tags: {
                amenity: 'recycling',
                ...oldTags,
            },
            loc: [0, 0],
        });
        const graph = new iD.coreGraph([entity]);

        const fields = {
            [fieldId]: iD.presetField('recycling', { type: fieldType, key: fieldKey, keys: fieldKeys }),
        };

        const oldPreset = iD.presetPreset(
            'amenity/recycling',
            { tags: { amenity: 'recycling' }, fields: [fieldId] },
            undefined,
            fields,
        );
        const newPreset = iD.presetPreset(
            'amenity/bench',
            { tags: { amenity: 'bench' }, fields: [fieldId] },
            undefined,
            fields,
        );
        const action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).toStrictEqual({
            // all field tags are preserved
            ...oldTags,
            amenity: 'bench', // override primary preset tag
        });
    });

    // https://github.com/openstreetmap/iD/issues/9372
    it('does not preserve old preset\'s primary tags when changing from a subpreset to its parent', () => {
        const entity = new iD.osmNode({tags: {highway: 'service', service: 'driveway', name: 'foo bar'}});
        const graph = new iD.coreGraph([entity]);
        const fields = {
            field: iD.presetField('field', {key: 'service'}),
            name: iD.presetField('name', {key: 'name'})
        };
        const oldPreset = iD.presetPreset('highway/service/driveway', {tags: {highway: 'service', service: 'driveway'}, fields: ['name']}, undefined, fields);
        const newPreset = iD.presetPreset('highway/service', {tags: {highway: 'service'}, fields: ['field', 'name']}, undefined, fields);
        const action = iD.actionChangePreset(entity.id, oldPreset, newPreset);
        expect(action(graph).entity(entity.id).tags).to.eql({highway: 'service', name: 'foo bar'});
    });
});
