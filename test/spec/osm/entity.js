describe('iD.osmEntity', function () {
    it('returns a subclass of the appropriate type', function () {
        expect(iD.osmEntity({type: 'node'})).be.an.instanceOf(iD.osmNode);
        expect(iD.osmEntity({type: 'way'})).be.an.instanceOf(iD.osmWay);
        expect(iD.osmEntity({type: 'relation'})).be.an.instanceOf(iD.osmRelation);
        expect(iD.osmEntity({id: 'n1'})).be.an.instanceOf(iD.osmNode);
        expect(iD.osmEntity({id: 'w1'})).be.an.instanceOf(iD.osmWay);
        expect(iD.osmEntity({id: 'r1'})).be.an.instanceOf(iD.osmRelation);
    });

    if (iD.debug) {
        it('is frozen', function () {
            expect(Object.isFrozen(iD.osmEntity())).to.be.true;
        });

        it('freezes tags', function () {
            expect(Object.isFrozen(iD.osmEntity().tags)).to.be.true;
        });
    }

    describe('.id', function () {
        it('generates unique IDs', function () {
            expect(iD.osmEntity.id('node')).not.to.equal(iD.osmEntity.id('node'));
        });

        describe('.fromOSM', function () {
            it('returns a ID string unique across entity types', function () {
                expect(iD.osmEntity.id.fromOSM('node', '1')).to.equal('n1');
            });
        });

        describe('.toOSM', function () {
            it('reverses fromOSM', function () {
                expect(iD.osmEntity.id.toOSM(iD.osmEntity.id.fromOSM('node', '1'))).to.equal('1');
            });
        });
    });

    describe('#copy', function () {
        it('returns a new Entity', function () {
            var n = iD.osmEntity({id: 'n'});
            var result = n.copy(null, {});
            expect(result).to.be.an.instanceof(iD.osmEntity);
            expect(result).not.to.equal(n);
        });

        it('adds the new Entity to input object', function () {
            var n = iD.osmEntity({id: 'n'});
            var copies = {};
            var result = n.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(copies.n).to.equal(result);
        });

        it('returns an existing copy in input object', function () {
            var n = iD.osmEntity({id: 'n'});
            var copies = {};
            var result1 = n.copy(null, copies);
            var result2 = n.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(result1).to.equal(result2);
        });

        it('resets \'id\', \'user\', and \'version\' properties', function () {
            var n = iD.osmEntity({id: 'n', version: 10, user: 'user'});
            var copies = {};
            n.copy(null, copies);
            expect(copies.n.isNew()).to.be.ok;
            expect(copies.n.version).to.be.undefined;
            expect(copies.n.user).to.be.undefined;
        });

        it('copies tags', function () {
            var n = iD.osmEntity({id: 'n', tags: {foo: 'foo'}});
            var copies = {};
            n.copy(null, copies);
            expect(copies.n.tags).to.equal(n.tags);
        });
    });

    describe('#update', function () {
        it('returns a new Entity', function () {
            var a = iD.osmEntity();
            var b = a.update({});
            expect(b instanceof iD.osmEntity).to.be.true;
            expect(a).not.to.equal(b);
        });

        it('updates the specified attributes', function () {
            var tags = {foo: 'bar'};
            var e = iD.osmEntity().update({tags: tags});
            expect(e.tags).to.equal(tags);
        });

        it('preserves existing attributes', function () {
            var e = iD.osmEntity({id: 'w1'}).update({});
            expect(e.id).to.equal('w1');
        });

        it('doesn\'t modify the input', function () {
            var attrs = {tags: {foo: 'bar'}};
            iD.osmEntity().update(attrs);
            expect(attrs).to.eql({tags: {foo: 'bar'}});
        });

        it('doesn\'t copy prototype properties', function () {
            expect(iD.osmEntity().update({})).not.to.have.ownProperty('update');
        });

        it('sets v to 1 if previously undefined', function() {
            expect(iD.osmEntity().update({}).v).to.equal(1);
        });

        it('increments v', function() {
            expect(iD.osmEntity({v: 1}).update({}).v).to.equal(2);
        });
    });

    describe('#mergeTags', function () {
        it('returns self if unchanged', function () {
            var a = iD.osmEntity({tags: {a: 'a'}});
            var b = a.mergeTags({a: 'a'});
            expect(a).to.equal(b);
        });

        it('returns a new Entity if changed', function () {
            var a = iD.osmEntity({tags: {a: 'a'}});
            var b = a.mergeTags({a: 'b'});
            expect(b instanceof iD.osmEntity).to.be.true;
            expect(a).not.to.equal(b);
        });

        it('merges tags', function () {
            var a = iD.osmEntity({tags: {a: 'a'}});
            var b = a.mergeTags({b: 'b'});
            expect(b.tags).to.eql({a: 'a', b: 'b'});
        });

        it('combines non-conflicting tags', function () {
            var a = iD.osmEntity({tags: {a: 'a'}});
            var b = a.mergeTags({a: 'a'});
            expect(b.tags).to.eql({a: 'a'});
        });

        it('combines conflicting tags with semicolons', function () {
            var a = iD.osmEntity({tags: {a: 'a'}});
            var b = a.mergeTags({a: 'b'});
            expect(b.tags).to.eql({a: 'a;b'});
        });

        it('combines combined tags', function () {
            var a = iD.osmEntity({tags: {a: 'a;b'}});
            var b = iD.osmEntity({tags: {a: 'b'}});

            expect(a.mergeTags(b.tags).tags).to.eql({a: 'a;b'});
            expect(b.mergeTags(a.tags).tags).to.eql({a: 'b;a'});
        });

        it('combines combined tags with whitespace', function () {
            var a = iD.osmEntity({tags: {a: 'a; b'}});
            var b = iD.osmEntity({tags: {a: 'b'}});

            expect(a.mergeTags(b.tags).tags).to.eql({a: 'a;b'});
            expect(b.mergeTags(a.tags).tags).to.eql({a: 'b;a'});
        });
    });

    describe('#osmId', function () {
        it('returns an OSM ID as a string', function () {
            expect(iD.osmEntity({id: 'w1234'}).osmId()).to.eql('1234');
            expect(iD.osmEntity({id: 'n1234'}).osmId()).to.eql('1234');
            expect(iD.osmEntity({id: 'r1234'}).osmId()).to.eql('1234');
        });
    });

    describe('#intersects', function () {
        it('returns true for a way with a node within the given extent', function () {
            var node  = iD.osmNode({loc: [0, 0]});
            var way   = iD.osmWay({nodes: [node.id]});
            var graph = iD.coreGraph([node, way]);
            expect(way.intersects([[-5, -5], [5, 5]], graph)).to.equal(true);
        });

        it('returns false for way with no nodes within the given extent', function () {
            var node  = iD.osmNode({loc: [6, 6]});
            var way   = iD.osmWay({nodes: [node.id]});
            var graph = iD.coreGraph([node, way]);
            expect(way.intersects([[-5, -5], [5, 5]], graph)).to.equal(false);
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

    describe('#hasParentRelations', function () {
        it('returns true for an entity that is a relation member', function () {
            var node = iD.osmNode();
            var relation = iD.osmRelation({members: [{id: node.id}]});
            var graph = iD.coreGraph([node, relation]);
            expect(node.hasParentRelations(graph)).to.equal(true);
        });

        it('returns false for an entity that is not a relation member', function () {
            var node = iD.osmNode();
            var graph = iD.coreGraph([node]);
            expect(node.hasParentRelations(graph)).to.equal(false);
        });
    });

    describe('#deprecatedTags', function () {
        it('returns none if entity has no tags', function () {
            expect(iD.osmEntity().deprecatedTags()).to.eql([]);
        });

        it('returns none when no tags are deprecated', function () {
            expect(iD.osmEntity({ tags: { amenity: 'toilets' } }).deprecatedTags()).to.eql([]);
        });

        it('returns 1:0 replacement', function () {
            expect(iD.osmEntity({ tags: { highway: 'no' } }).deprecatedTags()).to.eql(
                [{ old: { highway: 'no' } }]
            );
        });

        it('returns 1:1 replacement', function () {
            expect(iD.osmEntity({ tags: { amenity: 'toilet' } }).deprecatedTags()).to.eql(
                [{ old: { amenity: 'toilet' }, replace: { amenity: 'toilets' } }]
            );
        });

        it('returns 1:1 wildcard', function () {
            expect(iD.osmEntity({ tags: { speedlimit: '50' } }).deprecatedTags()).to.eql(
                [{ old: { speedlimit: '*' }, replace: { maxspeed: '$1' } }]
            );
        });

        it('returns 1:2 total replacement', function () {
            expect(iD.osmEntity({ tags: { man_made: 'water_tank' } }).deprecatedTags()).to.eql(
                [{ old: { man_made: 'water_tank' }, replace: { man_made: 'storage_tank', content: 'water' } }]
            );
        });

        it('returns 1:2 partial replacement', function () {
            expect(iD.osmEntity({ tags: { man_made: 'water_tank', content: 'water' } }).deprecatedTags()).to.eql(
                [{ old: { man_made: 'water_tank' }, replace: { man_made: 'storage_tank', content: 'water' } }]
            );
        });

        it('returns 2:1 replacement', function () {
            expect(iD.osmEntity({ tags: { amenity: 'gambling', gambling: 'casino' } }).deprecatedTags()).to.eql(
                [{ old: { amenity: 'gambling', gambling: 'casino' }, replace: { amenity: 'casino' } }]
            );
        });
    });

    describe('#hasWikidata', function () {
        it('returns false if entity has no tags', function () {
            expect(iD.osmEntity().hasWikidata()).to.be.not.ok;
        });

        it('returns true if entity has a wikidata tag', function () {
            expect(iD.osmEntity({ tags: { wikidata: 'Q18275868' } }).hasWikidata()).to.be.ok;
        });

        it('returns true if entity has a brand:wikidata tag', function () {
            expect(iD.osmEntity({ tags: { 'brand:wikidata': 'Q18275868' } }).hasWikidata()).to.be.ok;
        });
    });

    describe('#hasInterestingTags', function () {
        it('returns false if the entity has no tags', function () {
            expect(iD.osmEntity().hasInterestingTags()).to.equal(false);
        });

        it('returns true if the entity has tags other than \'attribution\', \'created_by\', \'source\', \'odbl\' and tiger tags', function () {
            expect(iD.osmEntity({tags: {foo: 'bar'}}).hasInterestingTags()).to.equal(true);
        });

        it('return false if the entity has only uninteresting tags', function () {
            expect(iD.osmEntity({tags: {source: 'Bing'}}).hasInterestingTags()).to.equal(false);
        });

        it('return false if the entity has only tiger tags', function () {
            expect(iD.osmEntity({tags: {'tiger:source': 'blah', 'tiger:foo': 'bar'}}).hasInterestingTags()).to.equal(false);
        });
    });

    describe('#isHighwayIntersection', function () {
        it('returns false', function () {
            expect(iD.osmEntity().isHighwayIntersection()).to.be.false;
        });
    });

    describe('#isDegenerate', function () {
        it('returns true', function () {
            expect(iD.osmEntity().isDegenerate()).to.be.true;
        });
    });

});
