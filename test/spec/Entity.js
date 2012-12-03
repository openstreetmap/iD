describe('Entity', function () {
    describe("#update", function () {
        it("returns a new Entity", function () {
            var a = iD.Entity(),
                b = a.update({});
            expect(b instanceof iD.Entity).toBeTruthy();
            expect(a).not.toBe(b);
        });

        it("updates the specified attributes", function () {
            var tags = {foo: 'bar'},
                e = iD.Entity().update({tags: tags});
            expect(e.tags).toBe(tags);
        });

        it("tags the entity as updated", function () {
            var tags = {foo: 'bar'},
                e = iD.Entity().update({tags: tags});
            expect(e._updated).toBe(true);
        });
    });

    describe("#created", function () {
        it("returns false for an unmodified Entity", function () {
            expect(iD.Entity({id: 'w1234'}).created()).toBeFalsy();
        });

        it("returns false for a modified Entity with positive ID", function () {
            expect(iD.Entity({id: 'w1234'}).update({}).created()).toBeFalsy();
        });

        it("returns true for a modified Entity with negative ID", function () {
           expect(iD.Entity({id: 'w-1234'}).update({}).created()).toBeTruthy();
        });
    });

    describe("#modified", function () {
        it("returns false for an unmodified Entity", function () {
            expect(iD.Entity({id: 'w1234'}).modified()).toBeFalsy();
        });

        it("returns true for a modified Entity with positive ID", function () {
            expect(iD.Entity({id: 'w1234'}).update({}).modified()).toBeTruthy();
        });

        it("returns false for a modified Entity with negative ID", function () {
           expect(iD.Entity({id: 'w-1234'}).update({}).modified()).toBeFalsy();
        });
    });
});

describe('Node', function () {
    it("returns a created Entity if no ID is specified", function () {
        expect(iD.Node().created()).toBeTruthy();
    });
});

describe('Way', function () {
    it("returns a created Entity if no ID is specified", function () {
        expect(iD.Way().created()).toBeTruthy();
    });
});

describe('Relation', function () {
    it("returns a created Entity if no ID is specified", function () {
        expect(iD.Relation().created()).toBeTruthy();
    });
});
