describe('iD.osmNode', function () {
    it('returns a node', function () {
        expect(iD.Node()).to.be.an.instanceOf(iD.Node);
        expect(iD.Node().type).to.equal('node');
    });

    it('defaults tags to an empty object', function () {
        expect(iD.Node().tags).to.eql({});
    });

    it('sets tags as specified', function () {
        expect(iD.Node({tags: {foo: 'bar'}}).tags).to.eql({foo: 'bar'});
    });

    describe('#extent', function() {
        it('returns a point extent', function() {
            expect(iD.Node({loc: [5, 10]}).extent().equals([[5, 10], [5, 10]])).to.be.ok;
        });
    });

    describe('#intersects', function () {
        it('returns true for a node within the given extent', function () {
            expect(iD.Node({loc: [0, 0]}).intersects([[-5, -5], [5, 5]])).to.equal(true);
        });

        it('returns false for a node outside the given extend', function () {
            expect(iD.Node({loc: [6, 6]}).intersects([[-5, -5], [5, 5]])).to.equal(false);
        });
    });

    describe('#geometry', function () {
        it('returns \'vertex\' if the node is a member of any way', function () {
            var node = iD.Node(),
                way  = iD.Way({nodes: [node.id]}),
                graph = iD.Graph([node, way]);
            expect(node.geometry(graph)).to.equal('vertex');
        });

        it('returns \'point\' if the node is not a member of any way', function () {
            var node = iD.Node(),
                graph = iD.Graph([node]);
            expect(node.geometry(graph)).to.equal('point');
        });
    });

    describe('#isIntersection', function () {
        it('returns true for a node shared by more than one highway', function () {
            var node = iD.Node(),
                w1 = iD.Way({nodes: [node.id], tags: {highway: 'residential'}}),
                w2 = iD.Way({nodes: [node.id], tags: {highway: 'residential'}}),
                graph = iD.Graph([node, w1, w2]);
            expect(node.isIntersection(graph)).to.equal(true);
        });

        it('returns true for a node shared by more than one waterway', function () {
            var node = iD.Node(),
                w1 = iD.Way({nodes: [node.id], tags: {waterway: 'river'}}),
                w2 = iD.Way({nodes: [node.id], tags: {waterway: 'river'}}),
                graph = iD.Graph([node, w1, w2]);
            expect(node.isIntersection(graph)).to.equal(true);
        });
    });

    describe('#isHighwayIntersection', function () {
        it('returns true for a node shared by more than one highway', function () {
            var node = iD.Node(),
                w1 = iD.Way({nodes: [node.id], tags: {highway: 'residential'}}),
                w2 = iD.Way({nodes: [node.id], tags: {highway: 'residential'}}),
                graph = iD.Graph([node, w1, w2]);
            expect(node.isHighwayIntersection(graph)).to.equal(true);
        });

        it('returns false for a node shared by more than one waterway', function () {
            var node = iD.Node(),
                w1 = iD.Way({nodes: [node.id], tags: {waterway: 'river'}}),
                w2 = iD.Way({nodes: [node.id], tags: {waterway: 'river'}}),
                graph = iD.Graph([node, w1, w2]);
            expect(node.isHighwayIntersection(graph)).to.equal(false);
        });
    });

    describe('#isDegenerate', function () {
        it('returns true if node has invalid loc', function () {
            expect(iD.Node().isDegenerate()).to.be.equal(true, 'no loc');
            expect(iD.Node({loc: ''}).isDegenerate()).to.be.equal(true, 'empty string loc');
            expect(iD.Node({loc: []}).isDegenerate()).to.be.equal(true, 'empty array loc');
            expect(iD.Node({loc: [0]}).isDegenerate()).to.be.equal(true, '1-array loc');
            expect(iD.Node({loc: [0, 0, 0]}).isDegenerate()).to.be.equal(true, '3-array loc');
            expect(iD.Node({loc: [-181, 0]}).isDegenerate()).to.be.equal(true, '< min lon');
            expect(iD.Node({loc: [181, 0]}).isDegenerate()).to.be.equal(true, '> max lon');
            expect(iD.Node({loc: [0, -91]}).isDegenerate()).to.be.equal(true, '< min lat');
            expect(iD.Node({loc: [0, 91]}).isDegenerate()).to.be.equal(true, '> max lat');
            expect(iD.Node({loc: [Infinity, 0]}).isDegenerate()).to.be.equal(true, 'Infinity lon');
            expect(iD.Node({loc: [0, Infinity]}).isDegenerate()).to.be.equal(true, 'Infinity lat');
            expect(iD.Node({loc: [NaN, 0]}).isDegenerate()).to.be.equal(true, 'NaN lon');
            expect(iD.Node({loc: [0, NaN]}).isDegenerate()).to.be.equal(true, 'NaN lat');
        });

        it('returns false if node has valid loc', function () {
            expect(iD.Node({loc: [0, 0]}).isDegenerate()).to.be.equal(false, '2-array loc');
            expect(iD.Node({loc: [-180, 0]}).isDegenerate()).to.be.equal(false, 'min lon');
            expect(iD.Node({loc: [180, 0]}).isDegenerate()).to.be.equal(false, 'max lon');
            expect(iD.Node({loc: [0, -90]}).isDegenerate()).to.be.equal(false, 'min lat');
            expect(iD.Node({loc: [0, 90]}).isDegenerate()).to.be.equal(false, 'max lat');
        });
    });

    describe('#asJXON', function () {
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

    describe('#asGeoJSON', function () {
        it('converts to a GeoJSON Point geometry', function () {
            var node = iD.Node({tags: {amenity: 'cafe'}, loc: [1, 2]}),
                json = node.asGeoJSON();

            expect(json.type).to.equal('Point');
            expect(json.coordinates).to.eql([1, 2]);
        });
    });
});
