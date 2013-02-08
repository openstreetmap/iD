describe("iD.actions.Circularize", function () {
    var projection = d3.geo.mercator();

    it("creates a circle of 12 nodes", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a', loc: [0, 0]}),
                'b': iD.Node({id: 'b', loc: [2, 0]}),
                'c': iD.Node({id: 'c', loc: [2, 2]}),
                'd': iD.Node({id: 'd', loc: [0, 2]}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            });

        graph = iD.actions.Circularize('-', projection)(graph);

        expect(graph.entity('-').nodes).to.have.length(13);
    });

    it("reuses existing nodes", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a', loc: [0, 0]}),
                'b': iD.Node({id: 'b', loc: [2, 0]}),
                'c': iD.Node({id: 'c', loc: [2, 2]}),
                'd': iD.Node({id: 'd', loc: [0, 2]}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            });

        graph = iD.actions.Circularize('-', projection)(graph);

        expect(graph.entity('-').nodes.slice(0, 4)).to.eql(['c', 'b', 'a', 'd']);
    });

    it("deletes unused nodes that are not members of other ways", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a', loc: [0, 0]}),
                'b': iD.Node({id: 'b', loc: [2, 0]}),
                'c': iD.Node({id: 'c', loc: [2, 2]}),
                'd': iD.Node({id: 'd', loc: [0, 2]}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']})
            });

        graph = iD.actions.Circularize('-', projection, 3)(graph);

        expect(graph.entity('d')).to.be.undefined;
    });

    it("reconnects unused nodes that are members of other ways", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a', loc: [0, 0]}),
                'b': iD.Node({id: 'b', loc: [2, 0]}),
                'c': iD.Node({id: 'c', loc: [2, 2]}),
                'd': iD.Node({id: 'd', loc: [0, 2]}),
                '-': iD.Way({id: '-', nodes: ['a', 'b', 'c', 'd', 'a']}),
                '=': iD.Way({id: '=', nodes: ['d']})
            });

        graph = iD.actions.Circularize('-', projection, 3)(graph);

        expect(graph.entity('d')).to.be.undefined;
        expect(graph.entity('=').nodes).to.eql(['c']);
    });
});
