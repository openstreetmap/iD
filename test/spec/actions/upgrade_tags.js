describe('iD.actionUpgradeTags', function () {

    it('upgrades a tag', function () {
        var oldTags = { amenity: 'swimming_pool' },
            newTags = { leisure: 'swimming_pool' },
            entity = iD.Entity({ tags: { amenity: 'swimming_pool', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ leisure: 'swimming_pool', name: 'Foo' });
    });

    it('upgrades a tag combination', function () {
        var oldTags = { amenity: 'vending_machine', vending: 'news_papers' },
            newTags = { amenity: 'vending_machine', vending: 'newspapers' },
            entity = iD.Entity({ tags: { amenity: 'vending_machine', vending: 'news_papers', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ amenity: 'vending_machine', vending: 'newspapers', name: 'Foo' });
    });

    it('upgrades a tag with multiple replacement tags', function () {
        var oldTags = { natural: 'marsh' },
            newTags = { natural: 'wetland', wetland: 'marsh' },
            entity = iD.Entity({ tags: { natural: 'marsh', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ natural: 'wetland', wetland: 'marsh', name: 'Foo' });
    });

    it('upgrades a tag with no replacement tags', function () {
        var oldTags = { highway: 'no' },
            newTags = undefined,
            entity = iD.Entity({ tags: { highway: 'no', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ name: 'Foo' });
    });

    it('upgrades a wildcard tag and moves the value', function () {
        var oldTags = { color: '*' },
            newTags = { colour: '$1' },
            entity = iD.Entity({ tags: { color: 'red', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ colour: 'red', name: 'Foo' });
    });

    it('upgrades a tag with a wildcard replacement and adds a default value', function () {
        var oldTags = { amenity: 'shop' },
            newTags = { shop: '*' },
            entity = iD.Entity({ tags: { amenity: 'shop', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ shop: 'yes', name: 'Foo' });
    });

    it('upgrades a tag with a wildcard replacement and maintains the existing value', function () {
        var oldTags = { amenity: 'shop' },
            newTags = { shop: '*' },
            entity = iD.Entity({ tags: { amenity: 'shop', shop: 'supermarket', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ shop: 'supermarket', name: 'Foo' });
    });

    it('upgrades a tag in a semicolon-delimited list with one other value', function () {
        var oldTags = { cuisine: 'vegan' },
            newTags = { 'diet:vegan': 'yes' },
            entity = iD.Entity({ tags: { cuisine: 'italian;vegan', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ cuisine: 'italian', 'diet:vegan': 'yes', name: 'Foo' });
    });

    it('upgrades a tag in a semicolon-delimited list with many other values', function () {
        var oldTags = { cuisine: 'vegan' },
            newTags = { 'diet:vegan': 'yes' },
            entity = iD.Entity({ tags: { cuisine: 'italian;vegan;regional;american', name: 'Foo' }}),
            graph  = iD.actionUpgradeTags(entity.id, oldTags, newTags)(iD.coreGraph([entity]));
        expect(graph.entity(entity.id).tags).to.eql({ cuisine: 'italian;regional;american', 'diet:vegan': 'yes', name: 'Foo' });
    });

});
