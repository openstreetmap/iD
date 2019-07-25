describe('iD.entityEntity', function () {
    it('returns a subclass of the appropriate type', function () {
        expect(iD.entityEntity({type: 'node'})).be.an.instanceOf(iD.entityNode);
        expect(iD.entityEntity({type: 'way'})).be.an.instanceOf(iD.entityWay);
        expect(iD.entityEntity({type: 'relation'})).be.an.instanceOf(iD.entityRelation);
        expect(iD.entityEntity({id: 'n1'})).be.an.instanceOf(iD.entityNode);
        expect(iD.entityEntity({id: 'w1'})).be.an.instanceOf(iD.entityWay);
        expect(iD.entityEntity({id: 'r1'})).be.an.instanceOf(iD.entityRelation);
    });

    if (iD.debug) {
        it('is frozen', function () {
            expect(Object.isFrozen(iD.entityEntity())).to.be.true;
        });

        it('freezes tags', function () {
            expect(Object.isFrozen(iD.entityEntity().tags)).to.be.true;
        });
    }

    describe('.id', function () {
        it('generates unique IDs', function () {
            expect(iD.entityEntity.id('node')).not.to.equal(iD.entityEntity.id('node'));
        });

        describe('.toTyped', function () {
            it('returns a ID string unique across entity types', function () {
                expect(iD.entityEntity.id.toTyped('node', '1')).to.equal('n1');
            });
        });

        describe('.toUntyped', function () {
            it('reverses toTyped', function () {
                expect(iD.entityEntity.id.toUntyped(iD.entityEntity.id.toTyped('node', '1'))).to.equal('1');
            });
        });
    });

    describe('#copy', function () {
        it('returns a new Entity', function () {
            var n = iD.entityEntity({id: 'n'});
            var result = n.copy(null, {});
            expect(result).to.be.an.instanceof(iD.entityEntity);
            expect(result).not.to.equal(n);
        });

        it('adds the new Entity to input object', function () {
            var n = iD.entityEntity({id: 'n'});
            var copies = {};
            var result = n.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(copies.n).to.equal(result);
        });

        it('returns an existing copy in input object', function () {
            var n = iD.entityEntity({id: 'n'});
            var copies = {};
            var result1 = n.copy(null, copies);
            var result2 = n.copy(null, copies);
            expect(Object.keys(copies)).to.have.length(1);
            expect(result1).to.equal(result2);
        });

        it('resets \'id\', \'user\', and \'version\' properties', function () {
            var n = iD.entityEntity({id: 'n', version: 10, user: 'user'});
            var copies = {};
            n.copy(null, copies);
            expect(copies.n.isNew()).to.be.ok;
            expect(copies.n.version).to.be.undefined;
            expect(copies.n.user).to.be.undefined;
        });

        it('copies tags', function () {
            var n = iD.entityEntity({id: 'n', tags: {foo: 'foo'}});
            var copies = {};
            n.copy(null, copies);
            expect(copies.n.tags).to.equal(n.tags);
        });
    });

    describe('#update', function () {
        it('returns a new Entity', function () {
            var a = iD.entityEntity();
            var b = a.update({});
            expect(b instanceof iD.entityEntity).to.be.true;
            expect(a).not.to.equal(b);
        });

        it('updates the specified attributes', function () {
            var tags = {foo: 'bar'};
            var e = iD.entityEntity().update({tags: tags});
            expect(e.tags).to.equal(tags);
        });

        it('preserves existing attributes', function () {
            var e = iD.entityEntity({id: 'w1'}).update({});
            expect(e.id).to.equal('w1');
        });

        it('doesn\'t modify the input', function () {
            var attrs = {tags: {foo: 'bar'}};
            iD.entityEntity().update(attrs);
            expect(attrs).to.eql({tags: {foo: 'bar'}});
        });

        it('doesn\'t copy prototype properties', function () {
            expect(iD.entityEntity().update({})).not.to.have.ownProperty('update');
        });

        it('sets v to 1 if previously undefined', function() {
            expect(iD.entityEntity().update({}).v).to.equal(1);
        });

        it('increments v', function() {
            expect(iD.entityEntity({v: 1}).update({}).v).to.equal(2);
        });
    });

    describe('#mergeTags', function () {
        it('returns self if unchanged', function () {
            var a = iD.entityEntity({tags: {a: 'a'}});
            var b = a.mergeTags({a: 'a'});
            expect(a).to.equal(b);
        });

        it('returns a new Entity if changed', function () {
            var a = iD.entityEntity({tags: {a: 'a'}});
            var b = a.mergeTags({a: 'b'});
            expect(b instanceof iD.entityEntity).to.be.true;
            expect(a).not.to.equal(b);
        });

        it('merges tags', function () {
            var a = iD.entityEntity({tags: {a: 'a'}});
            var b = a.mergeTags({b: 'b'});
            expect(b.tags).to.eql({a: 'a', b: 'b'});
        });

        it('combines non-conflicting tags', function () {
            var a = iD.entityEntity({tags: {a: 'a'}});
            var b = a.mergeTags({a: 'a'});
            expect(b.tags).to.eql({a: 'a'});
        });

        it('combines conflicting tags with semicolons', function () {
            var a = iD.entityEntity({tags: {a: 'a'}});
            var b = a.mergeTags({a: 'b'});
            expect(b.tags).to.eql({a: 'a;b'});
        });

        it('combines combined tags', function () {
            var a = iD.entityEntity({tags: {a: 'a;b'}});
            var b = iD.entityEntity({tags: {a: 'b'}});

            expect(a.mergeTags(b.tags).tags).to.eql({a: 'a;b'});
            expect(b.mergeTags(a.tags).tags).to.eql({a: 'b;a'});
        });

        it('combines combined tags with whitespace', function () {
            var a = iD.entityEntity({tags: {a: 'a; b'}});
            var b = iD.entityEntity({tags: {a: 'b'}});

            expect(a.mergeTags(b.tags).tags).to.eql({a: 'a;b'});
            expect(b.mergeTags(a.tags).tags).to.eql({a: 'b;a'});
        });
    });

    describe('#untypedID', function () {
        it('returns an untyped ID as a string', function () {
            expect(iD.entityEntity({id: 'w1234'}).untypedID()).to.eql('1234');
            expect(iD.entityEntity({id: 'n1234'}).untypedID()).to.eql('1234');
            expect(iD.entityEntity({id: 'r1234'}).untypedID()).to.eql('1234');
        });
    });

    describe('#intersects', function () {
        it('returns true for a way with a node within the given extent', function () {
            var node  = iD.entityNode({loc: [0, 0]});
            var way   = iD.entityWay({nodes: [node.id]});
            var graph = iD.coreGraph([node, way]);
            expect(way.intersects([[-5, -5], [5, 5]], graph)).to.equal(true);
        });

        it('returns false for way with no nodes within the given extent', function () {
            var node  = iD.entityNode({loc: [6, 6]});
            var way   = iD.entityWay({nodes: [node.id]});
            var graph = iD.coreGraph([node, way]);
            expect(way.intersects([[-5, -5], [5, 5]], graph)).to.equal(false);
        });
    });

    describe('#hasParentRelations', function () {
        it('returns true for an entity that is a relation member', function () {
            var node = iD.entityNode();
            var relation = iD.entityRelation({members: [{id: node.id}]});
            var graph = iD.coreGraph([node, relation]);
            expect(node.hasParentRelations(graph)).to.equal(true);
        });

        it('returns false for an entity that is not a relation member', function () {
            var node = iD.entityNode();
            var graph = iD.coreGraph([node]);
            expect(node.hasParentRelations(graph)).to.equal(false);
        });
    });

    describe('#isDegenerate', function () {
        it('returns true', function () {
            expect(iD.entityEntity().isDegenerate()).to.be.true;
        });
    });

});
