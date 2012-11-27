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
    });

    describe("#created", function () {
        it("returns false for an unmodified Entity", function () {
            expect(iD.Entity().created()).toBeFalsy();
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
            expect(iD.Entity().modified()).toBeFalsy();
        });

        it("returns true for a modified Entity with positive ID", function () {
            expect(iD.Entity({id: 'w1234'}).update({}).modified()).toBeTruthy();
        });

        it("returns false for a modified Entity with negative ID", function () {
           expect(iD.Entity({id: 'w-1234'}).update({}).modified()).toBeFalsy();
        });
    });
});
