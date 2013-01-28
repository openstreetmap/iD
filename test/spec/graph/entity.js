describe('iD.Entity', function () {
    it("returns a subclass of the appropriate type", function () {
        expect(iD.Entity({type: 'way'})).be.an.instanceOf(iD.Way);
        expect(iD.Entity({type: 'node'})).be.an.instanceOf(iD.Node);
        expect(iD.Entity({type: 'relation'})).be.an.instanceOf(iD.Relation);
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

        it("tags the entity as updated", function () {
            var tags = {foo: 'bar'},
                e = iD.Entity().update({tags: tags});
            expect(e._updated).to.to.be.true;
        });

        it("doesn't modify the input", function () {
            var attrs = {tags: {foo: 'bar'}},
                e = iD.Entity().update(attrs);
            expect(attrs).to.eql({tags: {foo: 'bar'}});
        });

        it("doesn't copy prototype properties", function () {
            expect(iD.Entity().update({})).not.to.have.ownProperty('update');
        });
    });

    describe("#osmId", function () {
        it("returns an OSM ID as a string", function () {
            expect(iD.Entity({id: 'w1234'}).osmId()).to.eql('1234');
            expect(iD.Entity({id: 'n1234'}).osmId()).to.eql('1234');
            expect(iD.Entity({id: 'r1234'}).osmId()).to.eql('1234');
        });
    });

    describe("#created", function () {
        it("returns falsy by default", function () {
            expect(iD.Entity({id: 'w1234'}).created()).not.to.be.ok;
        });

        it("returns falsy for an unmodified Entity", function () {
            expect(iD.Entity({id: 'w1234'}).created()).not.to.be.ok;
        });

        it("returns falsy for a modified Entity with positive ID", function () {
            expect(iD.Entity({id: 'w1234'}).update({}).created()).not.to.be.ok;
        });

        it("returns truthy for a modified Entity with negative ID", function () {
           expect(iD.Entity({id: 'w-1234'}).update({}).created()).to.be.ok;
        });
    });

    describe("#modified", function () {
        it("returns falsy by default", function () {
            expect(iD.Entity({id: 'w1234'}).modified()).not.to.be.ok;
        });

        it("returns falsy for an unmodified Entity", function () {
            expect(iD.Entity({id: 'w1234'}).modified()).not.to.be.ok;
        });

        it("returns truthy for a modified Entity with positive ID", function () {
            expect(iD.Entity({id: 'w1234'}).update({}).modified()).to.be.ok;
        });

        it("returns falsy for a modified Entity with negative ID", function () {
           expect(iD.Entity({id: 'w-1234'}).update({}).modified()).not.to.be.ok;
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

    describe("#friendlyName", function () {
        it("returns the name", function () {
            expect(iD.Entity({ tags: { name: 'hi' }}).friendlyName()).to.equal('hi');
        });

        it("returns a highway tag value", function () {
            expect(iD.Entity({ tags: { highway: 'Route 5' }}).friendlyName()).to.equal('Route 5');
        });

        it("prefers the name to a highway tag value", function () {
            expect(iD.Entity({ tags: { name: 'hi', highway: 'Route 5' }}).friendlyName()).to.equal('hi');
        });
    });
});
