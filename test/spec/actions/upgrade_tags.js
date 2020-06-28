describe('iD.actionUpgradeTags', function () {

    it('upgrades a tag', function () {
        var oldTags = { amenity: 'swimming_pool' },
            newTags = { leisure: 'swimming_pool' },
            entity = iD.osmEntity({ tags: { amenity: 'swimming_pool', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ leisure: 'swimming_pool', name: 'Foo' });
    });

    it('upgrades a tag combination', function () {
        var oldTags = { amenity: 'vending_machine', vending: 'news_papers' },
            newTags = { amenity: 'vending_machine', vending: 'newspapers' },
            entity = iD.osmEntity({ tags: { amenity: 'vending_machine', vending: 'news_papers', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ amenity: 'vending_machine', vending: 'newspapers', name: 'Foo' });
    });

    it('upgrades a tag with multiple replacement tags', function () {
        var oldTags = { natural: 'marsh' },
            newTags = { natural: 'wetland', wetland: 'marsh' },
            entity = iD.osmEntity({ tags: { natural: 'marsh', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ natural: 'wetland', wetland: 'marsh', name: 'Foo' });
    });

    it('upgrades a tag and overrides an existing value', function () {
        var oldTags = { landuse: 'wood' },
            newTags = { natural: 'wood' },
            entity = iD.osmEntity({ tags: { landuse: 'wood', natural: 'wetland', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ natural: 'wood', name: 'Foo' });
    });

    it('upgrades a tag with no replacement tags', function () {
        var oldTags = { highway: 'no' },
            newTags = undefined,
            entity = iD.osmEntity({ tags: { highway: 'no', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ name: 'Foo' });
    });

    it('upgrades a wildcard tag and moves the value', function () {
        var oldTags = { color: '*' },
            newTags = { colour: '$1' },
            entity = iD.osmEntity({ tags: { color: 'red', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ colour: 'red', name: 'Foo' });
    });

    it('upgrades a tag with a wildcard replacement and adds a default value', function () {
        var oldTags = { amenity: 'shop' },
            newTags = { shop: '*' },
            entity = iD.osmEntity({ tags: { amenity: 'shop', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ shop: 'yes', name: 'Foo' });
    });

    it('upgrades a tag with a wildcard replacement and maintains the existing value', function () {
        var oldTags = { amenity: 'shop' },
            newTags = { shop: '*' },
            entity = iD.osmEntity({ tags: { amenity: 'shop', shop: 'supermarket', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ shop: 'supermarket', name: 'Foo' });
    });

    it('upgrades a tag with a wildcard replacement and replaces the existing "no" value', function () {
        var oldTags = { amenity: 'shop' },
            newTags = { shop: '*' },
            entity = iD.osmEntity({ tags: { amenity: 'shop', shop: 'no', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ shop: 'yes', name: 'Foo' });
    });

    it('upgrades a tag from a semicolon-delimited list that has one other value', function () {
        var oldTags = { cuisine: 'vegan' },
            newTags = { 'diet:vegan': 'yes' },
            entity = iD.osmEntity({ tags: { cuisine: 'italian;vegan', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ cuisine: 'italian', 'diet:vegan': 'yes', name: 'Foo' });
    });

    it('upgrades a tag from a semicolon-delimited list that has many other values', function () {
        var oldTags = { cuisine: 'vegan' },
            newTags = { 'diet:vegan': 'yes' },
            entity = iD.osmEntity({ tags: { cuisine: 'italian;vegan;regional;american', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ cuisine: 'italian;regional;american', 'diet:vegan': 'yes', name: 'Foo' });
    });

    it('upgrades a tag within a semicolon-delimited list without changing other values', function () {
        var oldTags = { leisure: 'ice_rink', sport: 'hockey' },
            newTags = { leisure: 'ice_rink', sport: 'ice_hockey' },
            entity = iD.osmEntity({ tags: { leisure: 'ice_rink', sport: 'curling;hockey;multi', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ leisure: 'ice_rink', sport: 'curling;ice_hockey;multi', name: 'Foo' });
    });

});
