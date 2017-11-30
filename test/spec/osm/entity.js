describe('iD.osmEntity', function () {
    it('returns a subclass of the appropriate type', function () {
        expect(iD.Entity({type: 'node'})).be.an.instanceOf(iD.Node);
        expect(iD.Entity({type: 'way'})).be.an.instanceOf(iD.Way);
        expect(iD.Entity({type: 'relation'})).be.an.instanceOf(iD.Relation);
        expect(iD.Entity({id: 'n1'})).be.an.instanceOf(iD.Node);
        expect(iD.Entity({id: 'w1'})).be.an.instanceOf(iD.Way);
        expect(iD.Entity({id: 'r1'})).be.an.instanceOf(iD.Relation);
    });

    if (iD.debug) {
        it('is frozen', function () {
            expect(Object.isFrozen(iD.Entity())).to.be.true;
        });

        it('freezes tags', function () {
            expect(Object.isFrozen(iD.Entity().tags)).to.be.true;
        });
    }

    describe('.id', function () {
        it('generates unique IDs', function () {
            expect(iD.Entity.id('node')).not.to.equal(iD.Entity.id('node'));
        });

        describe('.fromOSM', function () {
            it('returns a ID string unique across entity types', function () {
                expect(iD.Entity.id.fromOSM('node', '1')).to.equal('n1');
            });
        });

        describe('.toOSM', function () {
            it('reverses fromOSM', function () {
                expect(iD.Entity.id.toOSM(iD.Entity.id.fromOSM('node', '1'))).to.equal('1');
            });
        });
    });

    describe('#copy', function () {
        it('returns a new Entity', function () {
            var n = iD.Entity({id: 'n'}),
                result = n.copy(null, {});
            expect(result).to.be.an.instanceof(iD.Entity);
            expect(result).not.to.equal(n);
        });

        it('adds the new Entity to input object', function () {
            var n = iD.Entity({id: 'n'}),
                copies = {},
                result = n.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(copies.n).to.equal(result);
        });

        it('returns an existing copy in input object', function () {
            var n = iD.Entity({id: 'n'}),
                copies = {},
                result1 = n.copy(null, copies),
                result2 = n.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(result1).to.equal(result2);
        });

        it('resets \'id\', \'user\', and \'version\' properties', function () {
            var n = iD.Entity({id: 'n', version: 10, user: 'user'}),
                copies = {};
            n.copy(null, copies);
            expect(copies.n.isNew()).to.be.ok;
            expect(copies.n.version).to.be.undefined;
            expect(copies.n.user).to.be.undefined;
        });

        it('copies tags', function () {
            var n = iD.Entity({id: 'n', tags: {foo: 'foo'}}),
                copies = {};
            n.copy(null, copies);
            expect(copies.n.tags).to.equal(n.tags);
        });
    });

    describe('#update', function () {
        it('returns a new Entity', function () {
            var a = iD.Entity(),
                b = a.update({});
            expect(b instanceof iD.Entity).to.be.true;
            expect(a).not.to.equal(b);
        });

        it('updates the specified attributes', function () {
            var tags = {foo: 'bar'},
                e = iD.Entity().update({tags: tags});
            expect(e.tags).to.equal(tags);
        });

        it('preserves existing attributes', function () {
            var e = iD.Entity({id: 'w1'}).update({});
            expect(e.id).to.equal('w1');
        });

        it('doesn\'t modify the input', function () {
            var attrs = {tags: {foo: 'bar'}};
            iD.Entity().update(attrs);
            expect(attrs).to.eql({tags: {foo: 'bar'}});
        });

        it('doesn\'t copy prototype properties', function () {
            expect(iD.Entity().update({})).not.to.have.ownProperty('update');
        });

        it('sets v to 1 if previously undefined', function() {
            expect(iD.Entity().update({}).v).to.equal(1);
        });

        it('increments v', function() {
            expect(iD.Entity({v: 1}).update({}).v).to.equal(2);
        });
    });

    describe('#mergeTags', function () {
        it('returns self if unchanged', function () {
            var a = iD.Entity({tags: {a: 'a'}}),
                b = a.mergeTags({a: 'a'});
            expect(a).to.equal(b);
        });

        it('returns a new Entity if changed', function () {
            var a = iD.Entity({tags: {a: 'a'}}),
                b = a.mergeTags({a: 'b'});
            expect(b instanceof iD.Entity).to.be.true;
            expect(a).not.to.equal(b);
        });

        it('merges tags', function () {
            var a = iD.Entity({tags: {a: 'a'}}),
                b = a.mergeTags({b: 'b'});
            expect(b.tags).to.eql({a: 'a', b: 'b'});
        });

        it('combines non-conflicting tags', function () {
            var a = iD.Entity({tags: {a: 'a'}}),
                b = a.mergeTags({a: 'a'});
            expect(b.tags).to.eql({a: 'a'});
        });

        it('combines conflicting tags with semicolons', function () {
            var a = iD.Entity({tags: {a: 'a'}}),
                b = a.mergeTags({a: 'b'});
            expect(b.tags).to.eql({a: 'a;b'});
        });

        it('combines combined tags', function () {
            var a = iD.Entity({tags: {a: 'a;b'}}),
                b = iD.Entity({tags: {a: 'b'}});

            expect(a.mergeTags(b.tags).tags).to.eql({a: 'a;b'});
            expect(b.mergeTags(a.tags).tags).to.eql({a: 'b;a'});
        });

        it('combines combined tags with whitespace', function () {
            var a = iD.Entity({tags: {a: 'a; b'}}),
                b = iD.Entity({tags: {a: 'b'}});

            expect(a.mergeTags(b.tags).tags).to.eql({a: 'a;b'});
            expect(b.mergeTags(a.tags).tags).to.eql({a: 'b;a'});
        });
    });

    describe('#osmId', function () {
        it('returns an OSM ID as a string', function () {
            expect(iD.Entity({id: 'w1234'}).osmId()).to.eql('1234');
            expect(iD.Entity({id: 'n1234'}).osmId()).to.eql('1234');
            expect(iD.Entity({id: 'r1234'}).osmId()).to.eql('1234');
        });
    });

    describe('#intersects', function () {
        it('returns true for a way with a node within the given extent', function () {
            var node  = iD.Node({loc: [0, 0]}),
                way   = iD.Way({nodes: [node.id]}),
                graph = iD.Graph([node, way]);
            expect(way.intersects([[-5, -5], [5, 5]], graph)).to.equal(true);
        });

        it('returns false for way with no nodes within the given extent', function () {
            var node  = iD.Node({loc: [6, 6]}),
                way   = iD.Way({nodes: [node.id]}),
                graph = iD.Graph([node, way]);
            expect(way.intersects([[-5, -5], [5, 5]], graph)).to.equal(false);
        });
    });

    describe('#isUsed', function () {
        it('returns false for an entity without tags', function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            expect(node.isUsed(graph)).to.equal(false);
        });

        it('returns true for an entity with tags', function () {
            var node = iD.Node({tags: {foo: 'bar'}}),
                graph = iD.Graph([node]);
            expect(node.isUsed(graph)).to.equal(true);
        });

        it('returns false for an entity with only an area=yes tag', function () {
            var node = iD.Node({tags: {area: 'yes'}}),
                graph = iD.Graph([node]);
            expect(node.isUsed(graph)).to.equal(false);
        });

        it('returns true for an entity that is a relation member', function () {
            var node = iD.Node(),
                relation = iD.Relation({members: [{id: node.id}]}),
                graph = iD.Graph([node, relation]);
            expect(node.isUsed(graph)).to.equal(true);
        });
    });

    describe('#hasDeprecatedTags', function () {
        it('returns false if entity has no tags', function () {
            expect(iD.Entity().deprecatedTags()).to.eql({});
        });

        it('returns true if entity has deprecated tags', function () {
            expect(iD.Entity({ tags: { barrier: 'wire_fence' } }).deprecatedTags()).to.eql({ barrier: 'wire_fence' });
        });
    });

    describe('#hasInterestingTags', function () {
        it('returns false if the entity has no tags', function () {
            expect(iD.Entity().hasInterestingTags()).to.equal(false);
        });

        it('returns true if the entity has tags other than \'attribution\', \'created_by\', \'source\', \'odbl\' and tiger tags', function () {
            expect(iD.Entity({tags: {foo: 'bar'}}).hasInterestingTags()).to.equal(true);
        });

        it('return false if the entity has only uninteresting tags', function () {
            expect(iD.Entity({tags: {source: 'Bing'}}).hasInterestingTags()).to.equal(false);
        });

        it('return false if the entity has only tiger tags', function () {
            expect(iD.Entity({tags: {'tiger:source': 'blah', 'tiger:foo': 'bar'}}).hasInterestingTags()).to.equal(false);
        });
    });

    describe('#isHighwayIntersection', function () {
        it('returns false', function () {
            expect(iD.Entity().isHighwayIntersection()).to.be.false;
        });
    });

    describe('#isDegenerate', function () {
        it('returns true', function () {
            expect(iD.Entity().isDegenerate()).to.be.true;
        });
    });

});
