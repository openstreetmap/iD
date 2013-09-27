describe('iD.Entity', function () {
    it("returns a subclass of the appropriate type", function () {
        expect(iD.Entity({type: 'node'})).be.an.instanceOf(iD.Node);
        expect(iD.Entity({type: 'way'})).be.an.instanceOf(iD.Way);
        expect(iD.Entity({type: 'relation'})).be.an.instanceOf(iD.Relation);
        expect(iD.Entity({id: 'n1'})).be.an.instanceOf(iD.Node);
        expect(iD.Entity({id: 'w1'})).be.an.instanceOf(iD.Way);
        expect(iD.Entity({id: 'r1'})).be.an.instanceOf(iD.Relation);
    });

    if (iD.debug) {
        it("is frozen", function () {
            expect(Object.isFrozen(iD.Entity())).to.be.true;
        });

        it("freezes tags", function () {
            expect(Object.isFrozen(iD.Entity().tags)).to.be.true;
        });
    }

    describe(".id", function () {
        it("generates unique IDs", function () {
            expect(iD.Entity.id('node')).not.to.equal(iD.Entity.id('node'));
        });

        describe(".fromOSM", function () {
            it("returns a ID string unique across entity types", function () {
                expect(iD.Entity.id.fromOSM('node', '1')).to.equal("n1");
            });
        });

        describe(".toOSM", function () {
            it("reverses fromOSM", function () {
                expect(iD.Entity.id.toOSM(iD.Entity.id.fromOSM('node', '1'))).to.equal('1');
            });
        });
    });

    describe("#update", function () {
        it("returns a new Entity", function () {
            var a = iD.Entity(),
                b = a.update({});
            expect(b instanceof iD.Entity).to.be.true;
            expect(a).not.to.equal(b);
        });

        it("updates the specified attributes", function () {
            var tags = {foo: 'bar'},
                e = iD.Entity().update({tags: tags});
            expect(e.tags).to.equal(tags);
        });

        it("preserves existing attributes", function () {
            var e = iD.Entity({id: 'w1'}).update({});
            expect(e.id).to.equal('w1');
        });

        it("doesn't modify the input", function () {
            var attrs = {tags: {foo: 'bar'}},
                e = iD.Entity().update(attrs);
            expect(attrs).to.eql({tags: {foo: 'bar'}});
        });

        it("doesn't copy prototype properties", function () {
            expect(iD.Entity().update({})).not.to.have.ownProperty('update');
        });

        it("sets v to 1 if previously undefined", function() {
            expect(iD.Entity().update({}).v).to.equal(1);
        });

        it("increments v", function() {
            expect(iD.Entity({v: 1}).update({}).v).to.equal(2);
        });
    });

    describe("#mergeTags", function () {
        it("returns self if unchanged", function () {
            var a = iD.Entity({tags: {a: 'a'}}),
                b = a.mergeTags({a: 'a'});
            expect(a).to.equal(b);
        });

        it("returns a new Entity if changed", function () {
            var a = iD.Entity({tags: {a: 'a'}}),
                b = a.mergeTags({a: 'b'});
            expect(b instanceof iD.Entity).to.be.true;
            expect(a).not.to.equal(b);
        });

        it("merges tags", function () {
            var a = iD.Entity({tags: {a: 'a'}}),
                b = a.mergeTags({b: 'b'});
            expect(b.tags).to.eql({a: 'a', b: 'b'});
        });

        it("combines non-conflicting tags", function () {
            var a = iD.Entity({tags: {a: 'a'}}),
                b = a.mergeTags({a: 'a'});
            expect(b.tags).to.eql({a: 'a'});
        });

        it("combines conflicting tags with semicolons", function () {
            var a = iD.Entity({tags: {a: 'a'}}),
                b = a.mergeTags({a: 'b'});
            expect(b.tags).to.eql({a: 'a;b'});
        });

        it("combines combined tags", function () {
            var a = iD.Entity({tags: {a: 'a;b'}}),
                b = iD.Entity({tags: {a: 'b'}});

            expect(a.mergeTags(b.tags).tags).to.eql({a: 'a;b'});
            expect(b.mergeTags(a.tags).tags).to.eql({a: 'b;a'});
        });

        it("combines combined tags with whitespace", function () {
            var a = iD.Entity({tags: {a: 'a; b'}}),
                b = iD.Entity({tags: {a: 'b'}});

            expect(a.mergeTags(b.tags).tags).to.eql({a: 'a;b'});
            expect(b.mergeTags(a.tags).tags).to.eql({a: 'b;a'});
        });
    });

    describe("#osmId", function () {
        it("returns an OSM ID as a string", function () {
            expect(iD.Entity({id: 'w1234'}).osmId()).to.eql('1234');
            expect(iD.Entity({id: 'n1234'}).osmId()).to.eql('1234');
            expect(iD.Entity({id: 'r1234'}).osmId()).to.eql('1234');
        });
    });

    describe("#intersects", function () {
        it("returns true for a way with a node within the given extent", function () {
            var node  = iD.Node({loc: [0, 0]}),
                way   = iD.Way({nodes: [node.id]}),
                graph = iD.Graph([node, way]);
            expect(way.intersects([[-5, -5], [5, 5]], graph)).to.equal(true);
        });

        it("returns false for way with no nodes within the given extent", function () {
            var node  = iD.Node({loc: [6, 6]}),
                way   = iD.Way({nodes: [node.id]}),
                graph = iD.Graph([node, way]);
            expect(way.intersects([[-5, -5], [5, 5]], graph)).to.equal(false);
        });
    });

    describe("#isUsed", function () {
        it("returns false for an entity without tags", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            expect(node.isUsed(graph)).to.equal(false);
        });

        it("returns true for an entity with tags", function () {
            var node = iD.Node({tags: {foo: 'bar'}}),
                graph = iD.Graph([node]);
            expect(node.isUsed(graph)).to.equal(true);
        });

        it("returns false for an entity with only an area=yes tag", function () {
            var node = iD.Node({tags: {area: 'yes'}}),
                graph = iD.Graph([node]);
            expect(node.isUsed(graph)).to.equal(false);
        });

        it("returns true for an entity that is a relation member", function () {
            var node = iD.Node(),
                relation = iD.Relation({members: [{id: node.id}]}),
                graph = iD.Graph([node, relation]);
            expect(node.isUsed(graph)).to.equal(true);
        });
    });

    describe("#hasDeprecatedTags", function () {
        it("returns false if entity has no tags", function () {
            expect(iD.Entity().deprecatedTags()).to.eql({});
        });

        it("returns true if entity has deprecated tags", function () {
            expect(iD.Entity({ tags: { barrier: 'wire_fence' } }).deprecatedTags()).to.eql({ barrier: 'wire_fence' });
        });
    });

    describe("#hasInterestingTags", function () {
        it("returns false if the entity has no tags", function () {
            expect(iD.Entity().hasInterestingTags()).to.equal(false);
        });

        it("returns true if the entity has tags other than 'attribution', 'created_by', 'source', 'odbl' and tiger tags", function () {
            expect(iD.Entity({tags: {foo: 'bar'}}).hasInterestingTags()).to.equal(true);
        });

        it("return false if the entity has only uninteresting tags", function () {
            expect(iD.Entity({tags: {source: 'Bing'}}).hasInterestingTags()).to.equal(false);
        });

        it("return false if the entity has only tiger tags", function () {
            expect(iD.Entity({tags: {'tiger:source': 'blah', 'tiger:foo': 'bar'}}).hasInterestingTags()).to.equal(false);
        });
    });

    describe("#area", function() {
        it("returns a relative measure of area", function () {
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a', loc: [-0.0002,  0.0001]}),
                    'b': iD.Node({id: 'b', loc: [ 0.0002,  0.0001]}),
                    'c': iD.Node({id: 'c', loc: [ 0.0002, -0.0001]}),
                    'd': iD.Node({id: 'd', loc: [-0.0002, -0.0001]}),
                    'e': iD.Node({id: 'a', loc: [-0.0004,  0.0002]}),
                    'f': iD.Node({id: 'b', loc: [ 0.0004,  0.0002]}),
                    'g': iD.Node({id: 'c', loc: [ 0.0004, -0.0002]}),
                    'h': iD.Node({id: 'd', loc: [-0.0004, -0.0002]}),
                    's': iD.Way({id: 's', tags: {area: 'yes'}, nodes: ['a', 'b', 'c', 'd', 'a']}),
                    'l': iD.Way({id: 'l', tags: {area: 'yes'}, nodes: ['e', 'f', 'g', 'h', 'e']})
                });

            var s = Math.abs(graph.entity('s').area(graph)),
                l = Math.abs(graph.entity('l').area(graph));

            expect(s).to.be.lt(l);
        });

        it("returns 0 for degenerate areas", function () {
            var graph = iD.Graph({
                    'a': iD.Node({id: 'a', loc: [-0.0002,  0.0001]}),
                    'b': iD.Node({id: 'b', loc: [ 0.0002,  0.0001]}),
                    'c': iD.Node({id: 'c', loc: [ 0.0002, -0.0001]}),
                    'd': iD.Node({id: 'd', loc: [-0.0002, -0.0001]}),
                    '0': iD.Way({id: '0', tags: {area: 'yes'}, nodes: []}),
                    '1': iD.Way({id: '1', tags: {area: 'yes'}, nodes: ['a']}),
                    '2': iD.Way({id: '2', tags: {area: 'yes'}, nodes: ['a', 'b']})
                });

            expect(graph.entity('0').area(graph)).to.equal(0);
            expect(graph.entity('1').area(graph)).to.equal(0);
            expect(graph.entity('2').area(graph)).to.equal(0);
        });
    });
});
