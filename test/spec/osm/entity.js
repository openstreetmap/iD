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
            expect(Object.isFrozen(new iD.osmNode())).to.be.true;
        });

        it('freezes tags', function () {
            expect(Object.isFrozen(new iD.osmNode().tags)).to.be.true;
        });
    }

    describe('.id', function () {
        it('generates unique IDs', function () {
            expect(iD.osmIdManager.newId('node')).not.to.equal(iD.osmIdManager.newId('node'));
        });

        describe('.fromOSM', function () {
            it('returns a ID string unique across entity types', function () {
                expect(iD.osmIdManager.fromOSM('node', '1')).to.equal('n1');
            });
        });

        describe('.toOSM', function () {
            it('reverses fromOSM', function () {
                expect(iD.osmIdManager.toOSM(iD.osmIdManager.fromOSM('node', '1'))).to.equal('1');
                expect(iD.osmIdManager.toOSM(iD.osmIdManager.fromOSM('node', '-1'))).to.equal('-1');
            });

            it('returns the empty string for other strings', function () {
                expect(iD.osmIdManager.toOSM('a')).to.equal('');
            });
        });
    });

    describe('#copy', function () {
        it('returns a new Entity', function () {
            var n = new iD.osmNode();
            var result = n.copy(null, {});
            expect(result).to.be.an.instanceof(iD.osmEntity);
            expect(result).not.to.equal(n);
        });

        it('adds the new Entity to input object', function () {
            var n = new iD.osmNode({id: 'n'});
            var copies = {};
            var result = n.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(copies.n).to.equal(result);
        });

        it('returns an existing copy in input object', function () {
            var n = new iD.osmNode();
            var copies = {};
            var result1 = n.copy(null, copies);
            var result2 = n.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(result1).to.equal(result2);
        });

        it('resets \'id\', \'user\', and \'version\' properties', function () {
            var n = new iD.osmNode({id: 'n', version: 10, user: 'user'});
            var copies = {};
            n.copy(null, copies);
            expect(copies.n.isNew()).to.be.ok;
            expect(copies.n.version).to.be.undefined;
            expect(copies.n.user).to.be.undefined;
        });

        it('copies tags', function () {
            var n = new iD.osmNode({id: 'n', tags: {foo: 'foo'}});
            var copies = {};
            n.copy(null, copies);
            expect(copies.n.tags).to.equal(n.tags);
        });
    });

    describe('#update', function () {
        it('returns a new Entity', function () {
            var a = new iD.osmNode();
            var b = a.update({});
            expect(b instanceof iD.osmEntity).to.be.true;
            expect(a).not.to.equal(b);
        });

        it('updates the specified attributes', function () {
            var tags = {foo: 'bar'};
            var e = new iD.osmNode().update({tags: tags});
            expect(e.tags).to.equal(tags);
        });

        it('preserves existing attributes', function () {
            var e = new iD.osmWay({id: 'w1'}).update({});
            expect(e.id).to.equal('w1');
        });

        it('doesn\'t modify the input', function () {
            var attrs = {tags: {foo: 'bar'}};
            new iD.osmNode().update(attrs);
            expect(attrs).to.eql({tags: {foo: 'bar'}});
        });

        it('doesn\'t copy prototype properties', function () {
            expect(new iD.osmNode().update({})).not.to.have.ownProperty('update');
        });

        it('sets v to 1 if previously undefined', function() {
            expect(new iD.osmNode().update({}).v).to.equal(1);
        });

        it('increments v', function() {
            expect(new iD.osmNode({v: 1}).update({}).v).to.equal(2);
        });
    });

    describe('#mergeTags', function () {
        it('returns self if unchanged', function () {
            var a = new iD.osmNode({tags: {a: 'a'}});
            var b = a.mergeTags({a: 'a'});
            expect(a).to.equal(b);
        });

        it('returns a new Entity if changed', function () {
            var a = new iD.osmNode({tags: {a: 'a'}});
            var b = a.mergeTags({a: 'b'});
            expect(b instanceof iD.osmEntity).to.be.true;
            expect(a).not.to.equal(b);
        });

        it('merges tags', function () {
            var a = new iD.osmNode({tags: {a: 'a'}});
            var b = a.mergeTags({b: 'b'});
            expect(b.tags).to.eql({a: 'a', b: 'b'});
        });

        it('combines non-conflicting tags', function () {
            var a = new iD.osmNode({tags: {a: 'a'}});
            var b = a.mergeTags({a: 'a'});
            expect(b.tags).to.eql({a: 'a'});
        });

        it('combines conflicting tags with semicolons', function () {
            var a = new iD.osmNode({tags: {a: 'a'}});
            var b = a.mergeTags({a: 'b'});
            expect(b.tags).to.eql({a: 'a;b'});
        });

        it('combines combined tags', function () {
            var a = new iD.osmNode({tags: {a: 'a;b'}});
            var b = new iD.osmNode({tags: {a: 'b'}});

            expect(a.mergeTags(b.tags).tags).to.eql({a: 'a;b'});
            expect(b.mergeTags(a.tags).tags).to.eql({a: 'b;a'});
        });

        it('combines combined tags with whitespace', function () {
            var a = new iD.osmNode({tags: {a: 'a; b'}});
            var b = new iD.osmNode({tags: {a: 'b'}});

            expect(a.mergeTags(b.tags).tags).to.eql({a: 'a;b'});
            expect(b.mergeTags(a.tags).tags).to.eql({a: 'b;a'});
        });

        it('accepts override tags', function () {
            const a = iD.osmEntity({tags: {a: 'a', c: '1'}});
            const b = iD.osmEntity({tags: {b: 'b', c: '2'}});

            const merged = a.mergeTags(b.tags, { c: '3' });

            expect(merged.tags.c).to.eql('3');
        });
    });

    describe('#osmId', function () {
        it('returns an OSM ID as a string', function () {
            expect(new iD.osmWay({id: 'w1234'}).osmId()).to.eql('1234');
            expect(new iD.osmNode({id: 'n1234'}).osmId()).to.eql('1234');
            expect(new iD.osmRelation({id: 'r1234'}).osmId()).to.eql('1234');
        });
    });

    describe('#intersects', function () {
        it('returns true for a way with a node within the given extent', function () {
            var node  = new iD.osmNode({loc: [0, 0]});
            var way   = new iD.osmWay({nodes: [node.id]});
            var graph = new iD.coreGraph([node, way]);
            expect(way.intersects([[-5, -5], [5, 5]], graph)).to.equal(true);
        });

        it('returns false for way with no nodes within the given extent', function () {
            var node  = new iD.osmNode({loc: [6, 6]});
            var way   = new iD.osmWay({nodes: [node.id]});
            var graph = new iD.coreGraph([node, way]);
            expect(way.intersects([[-5, -5], [5, 5]], graph)).to.equal(false);
        });
    });

    describe('#hasNonGeometryTags', function () {
        it('returns false for an entity without tags', function () {
            var node = new iD.osmNode();
            expect(node.hasNonGeometryTags()).to.equal(false);
        });

        it('returns true for an entity with tags', function () {
            var node = new iD.osmNode({tags: {foo: 'bar'}});
            expect(node.hasNonGeometryTags()).to.equal(true);
        });

        it('returns false for an entity with only an area=yes tag', function () {
            var node = new iD.osmNode({tags: {area: 'yes'}});
            expect(node.hasNonGeometryTags()).to.equal(false);
        });
    });

    describe('#hasParentRelations', function () {
        it('returns true for an entity that is a relation member', function () {
            var node = new iD.osmNode();
            var relation = new iD.osmRelation({members: [{id: node.id}]});
            var graph = new iD.coreGraph([node, relation]);
            expect(node.hasParentRelations(graph)).to.equal(true);
        });

        it('returns false for an entity that is not a relation member', function () {
            var node = new iD.osmNode();
            var graph = new iD.coreGraph([node]);
            expect(node.hasParentRelations(graph)).to.equal(false);
        });
    });

    describe('#hasInterestingTags', function () {
        it('returns false if the entity has no tags', function () {
            expect(new iD.osmNode().hasInterestingTags()).to.equal(false);
        });

        it('returns true if the entity has tags other than \'attribution\', \'created_by\', \'source\', \'odbl\' and tiger tags', function () {
            expect(new iD.osmNode({tags: {foo: 'bar'}}).hasInterestingTags()).to.equal(true);
        });

        it('return false if the entity has only uninteresting tags', function () {
            expect(new iD.osmNode({tags: {source: 'Bing'}}).hasInterestingTags()).to.equal(false);
        });

        it('return false if the entity has only tiger tags', function () {
            expect(new iD.osmNode({tags: {'tiger:source': 'blah', 'tiger:foo': 'bar'}}).hasInterestingTags()).to.equal(false);
        });
    });

    describe('#isDegenerate', function () {
        it('returns true', function () {
            expect(new iD.osmNode().isDegenerate()).to.be.true;
            expect(new iD.osmWay().isDegenerate()).to.be.true;
            expect(new iD.osmRelation().isDegenerate()).to.be.true;
        });
    });

});
