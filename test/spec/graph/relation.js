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

    describe("#multipolygon", function () {
        specify("single polygon consisting of a single way", function () {
            var a = iD.Node(),
                b = iD.Node(),
                c = iD.Node(),
                w = iD.Way({nodes: [a.id, b.id, c.id, a.id]}),
                r = iD.Relation({members: [{id: w.id, type: 'way'}]}),
                g = iD.Graph([a, b, c, w, r]);

            expect(r.multipolygon(g)).to.eql([[[a, b, c, a]]]);
        });

        specify("single polygon consisting of multiple ways", function () {
            var a  = iD.Node(),
                b  = iD.Node(),
                c  = iD.Node(),
                d  = iD.Node(),
                w1 = iD.Way({nodes: [a.id, b.id, c.id]}),
                w2 = iD.Way({nodes: [c.id, d.id, a.id]}),
                r  = iD.Relation({members: [{id: w2.id, type: 'way'}, {id: w1.id, type: 'way'}]}),
                g  = iD.Graph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a, b, c, d, a]]]); // TODO: not the only valid ordering
        });

        specify("single polygon consisting of multiple ways, one needing reversal", function () {
            var a  = iD.Node(),
                b  = iD.Node(),
                c  = iD.Node(),
                d  = iD.Node(),
                w1 = iD.Way({nodes: [a.id, b.id, c.id]}),
                w2 = iD.Way({nodes: [a.id, d.id, c.id]}),
                r  = iD.Relation({members: [{id: w2.id, type: 'way'}, {id: w1.id, type: 'way'}]}),
                g  = iD.Graph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a, b, c, d, a]]]); // TODO: not the only valid ordering
        });

        specify("multiple polygons consisting of single ways", function () {
            var a  = iD.Node(),
                b  = iD.Node(),
                c  = iD.Node(),
                d  = iD.Node(),
                e  = iD.Node(),
                f  = iD.Node(),
                w1 = iD.Way({nodes: [a.id, b.id, c.id, a.id]}),
                w2 = iD.Way({nodes: [d.id, e.id, f.id, d.id]}),
                r  = iD.Relation({members: [{id: w2.id, type: 'way'}, {id: w1.id, type: 'way'}]}),
                g  = iD.Graph([a, b, c, d, e, f, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a, b, c, a]], [[d, e, f, d]]]);
        });

        specify("invalid geometry: unclosed ring consisting of a single way", function () {
            var a = iD.Node(),
                b = iD.Node(),
                c = iD.Node(),
                w = iD.Way({nodes: [a.id, b.id, c.id]}),
                r = iD.Relation({members: [{id: w.id, type: 'way'}]}),
                g = iD.Graph([a, b, c, w, r]);

            expect(r.multipolygon(g)).to.eql([[[a, b, c]]]);
        });

        specify("invalid geometry: unclosed ring consisting of multiple ways", function () {
            var a  = iD.Node(),
                b  = iD.Node(),
                c  = iD.Node(),
                d  = iD.Node(),
                w1 = iD.Way({nodes: [a.id, b.id, c.id]}),
                w2 = iD.Way({nodes: [c.id, d.id]}),
                r  = iD.Relation({members: [{id: w2.id, type: 'way'}, {id: w1.id, type: 'way'}]}),
                g  = iD.Graph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a, b, c, d]]]);
        });

        specify("invalid geometry: unclosed ring consisting of multiple ways, alternate order", function () {
            var a  = iD.Node(),
                b  = iD.Node(),
                c  = iD.Node(),
                d  = iD.Node(),
                w1 = iD.Way({nodes: [c.id, d.id]}),
                w2 = iD.Way({nodes: [a.id, b.id, c.id]}),
                r  = iD.Relation({members: [{id: w2.id, type: 'way'}, {id: w1.id, type: 'way'}]}),
                g  = iD.Graph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a, b, c, d]]]);
        });

        specify("invalid geometry: unclosed ring consisting of multiple ways, one needing reversal", function () {
            var a  = iD.Node(),
                b  = iD.Node(),
                c  = iD.Node(),
                d  = iD.Node(),
                w1 = iD.Way({nodes: [a.id, b.id, c.id]}),
                w2 = iD.Way({nodes: [d.id, c.id]}),
                r  = iD.Relation({members: [{id: w2.id, type: 'way'}, {id: w1.id, type: 'way'}]}),
                g  = iD.Graph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a, b, c, d]]]);
        });

        specify("invalid geometry: unclosed ring consisting of multiple ways, one needing reversal, alternate order", function () {
            var a  = iD.Node(),
                b  = iD.Node(),
                c  = iD.Node(),
                d  = iD.Node(),
                w1 = iD.Way({nodes: [c.id, d.id]}),
                w2 = iD.Way({nodes: [c.id, b.id, a.id]}),
                r  = iD.Relation({members: [{id: w2.id, type: 'way'}, {id: w1.id, type: 'way'}]}),
                g  = iD.Graph([a, b, c, d, w1, w2, r]);

            expect(r.multipolygon(g)).to.eql([[[a, b, c, d]]]);
        });
    });
});
