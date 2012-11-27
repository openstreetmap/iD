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

        it("returns a modified Entity", function () {
            expect(iD.Entity().update({}).modified).toBeTruthy();
        });
    });
});
