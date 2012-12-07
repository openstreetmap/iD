describe('iD.Graph', function() {
    it("can be constructed with an entities Object", function () {
        var entity = iD.Entity(),
            graph = iD.Graph({'n-1': entity});
        expect(graph.entity('n-1')).to.equal(entity);
    });

    it("can be constructed with an entities Array", function () {
        var entity = iD.Entity(),
            graph = iD.Graph([entity]);
        expect(graph.entity(entity.id)).to.equal(entity);
    });

    if (iD.debug) {
        it("is frozen", function () {
            expect(Object.isFrozen(iD.Graph())).to.be.true;
        });

        it("freezes entities", function () {
            expect(Object.isFrozen(iD.Graph().entities)).to.be.true;
        });
    }

    describe('operations', function() {
        it('#remove', function() {
            var entities = { 'n-1': {
                    type: 'node',
                    loc: [-80, 30],
                    id: 'n-1'
                }
            };
            var graph = iD.Graph(entities, 'first graph');
            var g2 = graph.remove(entities['n-1'], 'Removed node');
            expect(graph.entity('n-1')).to.equal(entities['n-1']);
            expect(g2.entity('n-1')).to.equal(undefined);
        });
        it('#replace', function() {
            var entities = { 'n-1': {
                    type: 'node',
                    loc: [-80, 30],
                    id: 'n-1'
                }
            };
            var replacement = {
                type: 'node',
                loc: [-80, 40],
                id: 'n-1'
            };
            var graph = iD.Graph(entities, 'first graph');
            var g2 = graph.replace(replacement, 'Removed node');
            expect(graph.entity('n-1').loc[1]).to.equal(30);
            expect(g2.entity('n-1').loc[1]).to.equal(40);
        });
    });

    describe("#parentWays", function() {
        it("returns an array of ways that contain the given node id", function () {
            var node  = iD.Node({id: "n1"}),
                way   = iD.Way({id: "w1", nodes: ["n1"]}),
                graph = iD.Graph({n1: node, w1: way});
            expect(graph.parentWays("n1")).to.eql([way]);
            expect(graph.parentWays("n2")).to.eql([]);
        });
    });

    describe("#parentRelations", function() {
        it("returns an array of relations that contain the given entity id", function () {
            var node     = iD.Node({id: "n1"}),
                relation = iD.Relation({id: "r1", members: ["n1"]}),
                graph    = iD.Graph({n1: node, r1: relation});
            expect(graph.parentRelations("n1")).to.eql([relation]);
            expect(graph.parentRelations("n2")).to.eql([]);
        });
    });

    describe("#fetch", function () {
        it("replaces node ids with references", function () {
            var node  = iD.Node({id: "n1"}),
                way   = iD.Way({id: "w1", nodes: ["n1"]}),
                graph = iD.Graph({n1: node, w1: way});
            expect(graph.fetch("w1").nodes).to.eql([node]);
        });
    });

    describe("#modifications", function () {
        it("filters entities by modified", function () {
            var a = {id: 'a', modified: function () { return true; }},
                b = {id: 'b', modified: function () { return false; }},
                graph = iD.Graph({ 'a': a, 'b': b });
            expect(graph.modifications()).to.eql([graph.fetch('a')]);
        });
    });

    describe("#creations", function () {
        it("filters entities by created", function () {
            var a = {id: 'a', created: function () { return true; }},
                b = {id: 'b', created: function () { return false; }},
                graph = iD.Graph({ 'a': a, 'b': b });
            expect(graph.creations()).to.eql([graph.fetch('a')]);
        });
    });
});
