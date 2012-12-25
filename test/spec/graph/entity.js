describe('iD.Entity', function () {
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
                expect(iD.Entity.id.fromOSM('node', 1)).to.equal("n1");
            });
        });

        describe(".toOSM", function () {
            it("reverses fromOSM", function () {
                expect(iD.Entity.id.toOSM(iD.Entity.id.fromOSM('node', 1))).to.equal(1);
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
});

describe('iD.Node', function () {
    it("returns a node", function () {
        expect(iD.Node().type).to.equal("node");
    });

    it("returns a created Entity if no ID is specified", function () {
        expect(iD.Node().created()).to.be.ok;
    });

    it("returns an unmodified Entity if ID is specified", function () {
        expect(iD.Node({id: 'n1234'}).created()).not.to.be.ok;
        expect(iD.Node({id: 'n1234'}).modified()).not.to.be.ok;
    });

    it("defaults tags to an empty object", function () {
        expect(iD.Node().tags).to.eql({});
    });

    it("sets tags as specified", function () {
        expect(iD.Node({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });

    describe("#intersects", function () {
        it("returns true for a node within the given extent", function () {
            expect(iD.Node({loc: [0, 0]}).intersects([[-180, 90], [180, -90]])).to.equal(true);
        });

        it("returns false for a node outside the given extend", function () {
            expect(iD.Node({loc: [0, 0]}).intersects([[100, 90], [180, -90]])).to.equal(false);
        });
    });
});

describe('iD.Way', function () {
    if (iD.debug) {
        it("freezes nodes", function () {
            expect(Object.isFrozen(iD.Way().nodes)).to.be.true;
        });
    }

    it("returns a way", function () {
        expect(iD.Way().type).to.equal("way");
    });

    it("returns a created Entity if no ID is specified", function () {
        expect(iD.Way().created()).to.be.ok;
    });

    it("returns an unmodified Entity if ID is specified", function () {
        expect(iD.Way({id: 'w1234'}).created()).not.to.be.ok;
        expect(iD.Way({id: 'w1234'}).modified()).not.to.be.ok;
    });

    it("defaults nodes to an empty array", function () {
        expect(iD.Way().nodes).to.eql([]);
    });

    it("sets nodes as specified", function () {
        expect(iD.Way({nodes: ["n-1"]}).nodes).to.eql(["n-1"]);
    });

    it("defaults tags to an empty object", function () {
        expect(iD.Way().tags).to.eql({});
    });

    it("sets tags as specified", function () {
        expect(iD.Way({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });

    describe("#intersects", function () {
        it("returns true for a way with a node within the given extent", function () {
            var node  = iD.Node({loc: [0, 0]}),
                way   = iD.Way({nodes: [node.id]}),
                graph = iD.Graph([node, way]);
            expect(way.intersects([[-180, 90], [180, -90]], graph)).to.equal(true);
        });

        it("returns false for way with no nodes within the given extent", function () {
            var node  = iD.Node({loc: [0, 0]}),
                way   = iD.Way({nodes: [node.id]}),
                graph = iD.Graph([node, way]);
            expect(way.intersects([[100, 90], [180, -90]], graph)).to.equal(false);
        });
    });
});

describe('iD.Relation', function () {
    if (iD.debug) {
        it("freezes nodes", function () {
            expect(Object.isFrozen(iD.Relation().members)).to.be.true;
        });
    }

    it("returns a relation", function () {
        expect(iD.Relation().type).to.equal("relation");
    });

    it("returns a created Entity if no ID is specified", function () {
        expect(iD.Relation().created()).to.be.ok;
    });

    it("returns an unmodified Entity if ID is specified", function () {
        expect(iD.Relation({id: 'r1234'}).created()).not.to.be.ok;
        expect(iD.Relation({id: 'r1234'}).modified()).not.to.be.ok;
    });

    it("defaults members to an empty array", function () {
        expect(iD.Relation().members).to.eql([]);
    });

    it("sets members as specified", function () {
        expect(iD.Relation({members: ["n-1"]}).members).to.eql(["n-1"]);
    });

    it("defaults tags to an empty object", function () {
        expect(iD.Relation().tags).to.eql({});
    });

    it("sets tags as specified", function () {
        expect(iD.Relation({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });
});
