describe('Entity', function () {
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
    });

    describe("#created", function () {
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
});

describe('Node', function () {
    it("returns a created Entity if no ID is specified", function () {
        expect(iD.Node().created()).to.be.true;
    });
});

describe('Way', function () {
    it("returns a created Entity if no ID is specified", function () {
        expect(iD.Way().created()).to.be.true;
    });
});

describe('Relation', function () {
    it("returns a created Entity if no ID is specified", function () {
        expect(iD.Relation().created()).to.be.true;
    });
});
