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
            expect(graph.entity('n-1')).toEqual(entities['n-1']);
        });

        it('annotation', function() {
            var graph = iD.Graph({}, 'first graph');
            expect(graph.annotation).toEqual('first graph');
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
            expect(graph.entity('n-1')).toEqual(entities['n-1']);
            expect(g2.entity('n-1')).toEqual(undefined);
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
            expect(graph.entity('n-1').lat).toEqual(30);
            expect(g2.entity('n-1').lat).toEqual(40);
        });
    });

    describe("#modifications", function () {
        it("filters entities by modified", function () {
            var a = {id: 'a', modified: function () { return true; }},
                b = {id: 'b', modified: function () { return false; }},
                graph = iD.Graph({ 'a': a, 'b': b });
            expect(graph.modifications()).toEqual([graph.fetch('a')]);
        });
    });

    describe("#creations", function () {
        it("filters entities by created", function () {
            var a = {id: 'a', created: function () { return true; }},
                b = {id: 'b', created: function () { return false; }},
                graph = iD.Graph({ 'a': a, 'b': b });
            expect(graph.creations()).toEqual([graph.fetch('a')]);
        });
    });
});
