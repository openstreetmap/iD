describe('iD.osmEntity', function () {

    describe('#hasDeprecatedTags', function () {
        it('returns false if entity has no tags', function () {
            expect(iD.osmNode().deprecatedTags()).to.eql([]);
        });

        it('returns true if entity has deprecated tags', function () {
            expect(iD.osmNode({ tags: { amenity: 'toilet' } }).deprecatedTags()).to.eql(
                [{ old: { amenity: 'toilet' }, replace: { amenity: 'toilets' } }]
            );
        });
    });

    describe('#hasNonGeometryTags', function () {
        it('returns false for an entity without tags', function () {
            var node = iD.osmNode();
            expect(node.hasNonGeometryTags()).to.equal(false);
        });

        it('returns true for an entity with tags', function () {
            var node = iD.osmNode({tags: {foo: 'bar'}});
            expect(node.hasNonGeometryTags()).to.equal(true);
        });

        it('returns false for an entity with only an area=yes tag', function () {
            var node = iD.osmNode({tags: {area: 'yes'}});
            expect(node.hasNonGeometryTags()).to.equal(false);
        });
    });

    describe('#hasWikidata', function () {
        it('returns false if entity has no tags', function () {
            expect(iD.osmNode().hasWikidata()).to.be.not.ok;
        });

        it('returns true if entity has a wikidata tag', function () {
            expect(iD.osmNode({ tags: { wikidata: 'Q18275868' } }).hasWikidata()).to.be.ok;
        });

        it('returns true if entity has a brand:wikidata tag', function () {
            expect(iD.osmNode({ tags: { 'brand:wikidata': 'Q18275868' } }).hasWikidata()).to.be.ok;
        });
    });

    describe('#hasInterestingTags', function () {
        it('returns false if the entity has no tags', function () {
            expect(iD.osmNode().hasInterestingTags()).to.equal(false);
        });

        it('returns true if the entity has tags other than \'attribution\', \'created_by\', \'source\', \'odbl\' and tiger tags', function () {
            expect(iD.osmNode({tags: {foo: 'bar'}}).hasInterestingTags()).to.equal(true);
        });

        it('return false if the entity has only uninteresting tags', function () {
            expect(iD.osmNode({tags: {source: 'Bing'}}).hasInterestingTags()).to.equal(false);
        });

        it('return false if the entity has only tiger tags', function () {
            expect(iD.osmNode({tags: {'tiger:source': 'blah', 'tiger:foo': 'bar'}}).hasInterestingTags()).to.equal(false);
        });
    });

});
