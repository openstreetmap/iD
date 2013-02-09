describe("iD.Difference", function () {
    describe("#changes", function () {
        it("includes created entities", function () {
            var node = iD.Node({id: 'n'}),
                base = iD.Graph(),
                head = base.replace(node),
                diff = iD.Difference(base, head);
            expect(diff.changes()).to.eql({n: {base: undefined, head: node}});
        });

        it("includes undone created entities", function () {
            var node = iD.Node({id: 'n'}),
                base = iD.Graph(),
                head = base.replace(node),
                diff = iD.Difference(head, base);
            expect(diff.changes()).to.eql({n: {base: node, head: undefined}});
        });

        it("includes modified entities", function () {
            var n1 = iD.Node({id: 'n'}),
                n2 = n1.update(),
                base = iD.Graph([n1]),
                head = base.replace(n2),
                diff = iD.Difference(base, head);
            expect(diff.changes()).to.eql({n: {base: n1, head: n2}});
        });

        it("includes undone modified entities", function () {
            var n1 = iD.Node({id: 'n'}),
                n2 = n1.update(),
                base = iD.Graph([n1]),
                head = base.replace(n2),
                diff = iD.Difference(head, base);
            expect(diff.changes()).to.eql({n: {base: n2, head: n1}});
        });

        it("includes deleted entities", function () {
            var node = iD.Node({id: 'n'}),
                base = iD.Graph([node]),
                head = base.remove(node),
                diff = iD.Difference(base, head);
            expect(diff.changes()).to.eql({n: {base: node, head: undefined}});
        });

        it("includes undone deleted entities", function () {
            var node = iD.Node({id: 'n'}),
                base = iD.Graph([node]),
                head = base.remove(node),
                diff = iD.Difference(head, base);
            expect(diff.changes()).to.eql({n: {base: undefined, head: node}});
        });

        it("doesn't include created entities that were subsequently deleted", function () {
            var node = iD.Node(),
                base = iD.Graph(),
                head = base.replace(node).remove(node),
                diff = iD.Difference(base, head);
            expect(diff.changes()).to.eql({});
        });
    });

    describe("#extantIDs", function () {
        it("includes the ids of created entities", function () {
            var node = iD.Node({id: 'n'}),
                base = iD.Graph(),
                head = base.replace(node),
                diff = iD.Difference(base, head);
            expect(diff.extantIDs()).to.eql(['n']);
        });

        it("includes the ids of modified entities", function () {
            var n1 = iD.Node({id: 'n'}),
                n2 = n1.move([1, 2]),
                base = iD.Graph([n1]),
                head = base.replace(n2),
                diff = iD.Difference(base, head);
            expect(diff.extantIDs()).to.eql(['n']);
        });

        it("omits the ids of deleted entities", function () {
            var node = iD.Node({id: 'n'}),
                base = iD.Graph([node]),
                head = base.remove(node),
                diff = iD.Difference(base, head);
            expect(diff.extantIDs()).to.eql([]);
        });
    });

    describe("#created", function () {
        it("returns an array of created entities", function () {
            var node = iD.Node({id: 'n'}),
                base = iD.Graph(),
                head = base.replace(node),
                diff = iD.Difference(base, head);
            expect(diff.created()).to.eql([node]);
        });
    });

    describe("#modified", function () {
        it("returns an array of modified entities", function () {
            var n1 = iD.Node({id: 'n'}),
                n2 = n1.move([1, 2]),
                base = iD.Graph([n1]),
                head = base.replace(n2),
                diff = iD.Difference(base, head);
            expect(diff.modified()).to.eql([n2]);
        });
    });

    describe("#deleted", function () {
        it("returns an array of deleted entities", function () {
            var node = iD.Node({id: 'n'}),
                base = iD.Graph([node]),
                head = base.remove(node),
                diff = iD.Difference(base, head);
            expect(diff.deleted()).to.eql([node]);
        });
    });

    describe("#complete", function () {
        it("includes created entities", function () {
            var node = iD.Node({id: 'n'}),
                base = iD.Graph(),
                head = base.replace(node),
                diff = iD.Difference(base, head);
            expect(diff.complete()['n']).to.equal(node);
        });

        it("includes modified entities", function () {
            var n1 = iD.Node({id: 'n'}),
                n2 = n1.move([1, 2]),
                base = iD.Graph([n1]),
                head = base.replace(n2),
                diff = iD.Difference(base, head);
            expect(diff.complete()['n']).to.equal(n2);
        });

        it("includes deleted entities", function () {
            var node = iD.Node({id: 'n'}),
                base = iD.Graph([node]),
                head = base.remove(node),
                diff = iD.Difference(base, head);
            expect(diff.complete()).to.eql({n: undefined});
        });

        it("includes nodes added to a way", function () {
            var n1 = iD.Node({id: 'n1'}),
                n2 = iD.Node({id: 'n2'}),
                w1 = iD.Way({id: 'w', nodes: ['n1']}),
                w2 = w1.addNode('n2'),
                base = iD.Graph([n1, n2, w1]),
                head = base.replace(w2),
                diff = iD.Difference(base, head);

            expect(diff.complete()['n2']).to.equal(n2);
        });

        it("includes nodes removed from a way", function () {
            var n1 = iD.Node({id: 'n1'}),
                n2 = iD.Node({id: 'n2'}),
                w1 = iD.Way({id: 'w', nodes: ['n1', 'n2']}),
                w2 = w1.removeNode('n2'),
                base = iD.Graph([n1, n2, w1]),
                head = base.replace(w2),
                diff = iD.Difference(base, head);

            expect(diff.complete()['n2']).to.equal(n2);
        });

        it("includes parent ways of modified nodes", function () {
            var n1   = iD.Node({id: 'n'}),
                n2   = n1.move([1, 2]),
                way  = iD.Way({id: 'w', nodes: ['n']}),
                base = iD.Graph([n1, way]),
                head = base.replace(n2),
                diff = iD.Difference(base, head);

            expect(diff.complete()['w']).to.equal(way);
        });

        it("includes parent relations of modified entities", function () {
            var n1   = iD.Node({id: 'n'}),
                n2   = n1.move([1, 2]),
                rel  = iD.Relation({id: 'r', members: [{id: 'n'}]}),
                base = iD.Graph([n1, rel]),
                head = base.replace(n2),
                diff = iD.Difference(base, head);

            expect(diff.complete()['r']).to.equal(rel);
        });

        it("includes parent relations of modified entities, recursively", function () {
            var n1   = iD.Node({id: 'n'}),
                n2   = n1.move([1, 2]),
                rel1 = iD.Relation({id: 'r1', members: [{id: 'n'}]}),
                rel2 = iD.Relation({id: 'r2', members: [{id: 'r1'}]}),
                base = iD.Graph([n1, rel1, rel2]),
                head = base.replace(n2),
                diff = iD.Difference(base, head);

            expect(diff.complete()['r2']).to.equal(rel2);
        });

        it("includes parent relations of parent ways of modified nodes", function () {
            var n1   = iD.Node({id: 'n'}),
                n2   = n1.move([1, 2]),
                way  = iD.Way({id: 'w', nodes: ['n']}),
                rel  = iD.Relation({id: 'r', members: [{id: 'w'}]}),
                base = iD.Graph([n1, way, rel]),
                head = base.replace(n2),
                diff = iD.Difference(base, head);

            expect(diff.complete()['r']).to.equal(rel);
        });

        it("copes with recursive relations", function () {
            var node = iD.Node({id: 'n'}),
                rel1 = iD.Relation({id: 'r1', members: [{id: 'n'}, {id: 'r2'}]}),
                rel2 = iD.Relation({id: 'r2', members: [{id: 'r1'}]}),
                base = iD.Graph([node, rel1, rel2]),
                head = base.replace(node.move([1, 2])),
                diff = iD.Difference(base, head);

            expect(diff.complete()).to.be.ok;
        });

        it("limits changes to those within a given extent");
    });
});
