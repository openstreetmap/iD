describe('iD.Way', function() {
    if (iD.debug) {
        it("freezes nodes", function () {
            expect(Object.isFrozen(iD.Way().nodes)).to.be.true;
        });
    }

    it("returns a way", function () {
        expect(iD.Way()).to.be.an.instanceOf(iD.Way);
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

    describe('#isClosed', function() {
        it('returns false when the way ends are not equal', function() {
            expect(iD.Way({nodes: ['n1', 'n2']}).isClosed()).to.equal(false);
        });

        it('returns true when the way ends are equal', function() {
            expect(iD.Way({nodes: ['n1', 'n2', 'n1']}).isClosed()).to.equal(true);
        });
    });

    describe('#isOneWay', function() {
        it('returns false when the way has no tags', function() {
            expect(iD.Way().isOneWay()).to.eql(false);
        });

        it('returns false when the way has tag oneway=no', function() {
            expect(iD.Way({tags: { oneway: 'no' }}).isOneWay()).to.equal(false);
        });

        it('returns true when the way has tag oneway=yes', function() {
            expect(iD.Way({tags: { oneway: 'yes' }}).isOneWay()).to.equal(true);
        });
    });
});
