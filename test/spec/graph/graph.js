describe('Graph', function() {

    describe('Construction and access', function() {
        it('entity', function() {
            var entities = { 'n-1': {
                    type: 'node',
                    lat: 30,
                    lon: -80,
                    id: 'n-1'
                }
            };
            var graph = iD.Graph(entities, 'first graph');
            expect(graph.entity('n-1')).to.equal(entities['n-1']);
        });

        it('annotation', function() {
            var graph = iD.Graph({}, 'first graph');
            expect(graph.annotation).to.equal('first graph');
        });
    });

    describe('operations', function() {
        it('#remove', function() {
            var entities = { 'n-1': {
                    type: 'node',
                    lat: 30,
                    lon: -80,
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
                    lat: 30,
                    lon: -80,
                    id: 'n-1'
                }
            };
            var replacement = {
                type: 'node',
                lat: 40,
                lon: -80,
                id: 'n-1'
            };
            var graph = iD.Graph(entities, 'first graph');
            var g2 = graph.replace(replacement, 'Removed node');
            expect(graph.entity('n-1').lat).to.equal(30);
            expect(g2.entity('n-1').lat).to.equal(40);
        });
    });

    describe("#fetch", function () {
        it("replaces node ids with references", function () {
            var node  = iD.Node({id: "n1"}),
                way   = iD.Way({id: "w1", nodes: ["n1"]}),
                graph = iD.Graph({n1: node, w1: way});
            expect(graph.fetch("w1").nodes[0].id).to.equal("n1");
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
