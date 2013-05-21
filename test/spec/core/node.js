describe('iD.Node', function () {
    it("returns a node", function () {
        expect(iD.Node()).to.be.an.instanceOf(iD.Node);
        expect(iD.Node().type).to.equal("node");
    });

    it("defaults tags to an empty object", function () {
        expect(iD.Node().tags).to.eql({});
    });

    it("sets tags as specified", function () {
        expect(iD.Node({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });

    describe("#extent", function() {
        it("returns a point extent", function() {
            expect(iD.Node({loc: [5, 10]}).extent()).to.eql([[5, 10], [5, 10]]);
        });
    });

    describe("#intersects", function () {
        it("returns true for a node within the given extent", function () {
            expect(iD.Node({loc: [0, 0]}).intersects([[-5, -5], [5, 5]])).to.equal(true);
        });

        it("returns false for a node outside the given extend", function () {
            expect(iD.Node({loc: [6, 6]}).intersects([[-5, -5], [5, 5]])).to.equal(false);
        });
    });

    describe("#geometry", function () {
        it("returns 'vertex' if the node is a member of any way", function () {
            var node = iD.Node(),
                way  = iD.Way({nodes: [node.id]}),
                graph = iD.Graph([node, way]);
            expect(node.geometry(graph)).to.equal('vertex');
        });

        it("returns 'point' if the node is not a member of any way", function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            expect(node.geometry(graph)).to.equal('point');
        });
    });

    describe("#isIntersection", function () {
        it("returns true for a node shared by more than one highway", function () {
            var node = iD.Node(),
                w1 = iD.Way({nodes: [node.id], tags: {highway: 'residential'}}),
                w2 = iD.Way({nodes: [node.id], tags: {highway: 'residential'}}),
                graph = iD.Graph([node, w1, w2]);
            expect(node.isIntersection(graph)).to.equal(true);
        });

        it("returns true for a node shared by more two non-highways", function () {
            var node = iD.Node(),
                w1 = iD.Way({nodes: [node.id]}),
                w2 = iD.Way({nodes: [node.id]}),
                graph = iD.Graph([node, w1, w2]);
            expect(node.isIntersection(graph)).to.equal(false);
        });
    });

    describe("#asJXON", function () {
        it('converts a node to jxon', function() {
            var node = iD.Node({id: 'n-1', loc: [-77, 38], tags: {amenity: 'cafe'}});
            expect(node.asJXON()).to.eql({node: {
                '@id': '-1',
                '@lon': -77,
                '@lat': 38,
                '@version': 0,
                tag: [{keyAttributes: {k: 'amenity', v: 'cafe'}}]}});
        });

        it('includes changeset if provided', function() {
            expect(iD.Node({loc: [0, 0]}).asJXON('1234').node['@changeset']).to.equal('1234');
        });
    });

    describe("#asGeoJSON", function () {
        it("converts to a GeoJSON Point features", function () {
            var node = iD.Node({tags: {amenity: 'cafe'}, loc: [1, 2]}),
                json = node.asGeoJSON();

            expect(json.type).to.equal('Feature');
            expect(json.properties).to.eql({amenity: 'cafe'});
            expect(json.geometry.type).to.equal('Point');
            expect(json.geometry.coordinates).to.eql([1, 2]);
        });
    });
});
