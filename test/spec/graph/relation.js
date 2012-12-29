describe('iD.Relation', function () {
    if (iD.debug) {
        it("freezes nodes", function () {
            expect(Object.isFrozen(iD.Relation().members)).to.be.true;
        });
    }

    it("returns a relation", function () {
        expect(iD.Relation()).to.be.an.instanceOf(iD.Relation);
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

    describe("#extent", function () {
        it("returns the minimal extent containing the extents of all members");
    });
});
