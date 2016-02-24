describe("iD.svg.Lines", function () {
    var surface,
        projection = d3.geo.projection(function(x, y) { return [x, y]; })
            .clipExtent([[0, 0], [Infinity, Infinity]]),
        all = d3.functor(true),
        none = d3.functor(false);

    beforeEach(function () {
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Layers(iD()));
    });

    it("adds way and line classes", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [1, 1]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            graph = iD.Graph([a, b, line]);

        surface.call(iD.svg.Lines(projection), graph, [line], all);

        expect(surface.select('path.way')).to.be.classed('way');
        expect(surface.select('path.line')).to.be.classed('line');
    });

    it("adds tag classes", function () {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [1, 1]}),
            line = iD.Way({nodes: [a.id, b.id], tags: {highway: 'residential'}}),
            graph = iD.Graph([a, b, line]);

        surface.call(iD.svg.Lines(projection), graph, [line], all);

        expect(surface.select('.line')).to.be.classed('tag-highway');
        expect(surface.select('.line')).to.be.classed('tag-highway-residential');
    });

    it("adds stroke classes for the tags of the parent relation of multipolygon members", function() {
        var a = iD.Node({loc: [0, 0]}),
            b = iD.Node({loc: [1, 1]}),
            line = iD.Way({nodes: [a.id, b.id]}),
            relation = iD.Relation({members: [{id: line.id}], tags: {type: 'multipolygon', natural: 'wood'}}),
            graph = iD.Graph([a, b, line, relation]);

        surface.call(iD.svg.Lines(projection), graph, [line], all);

        expect(surface.select('.stroke')).to.be.classed('tag-natural-wood');
    });

    it("renders stroke for outer way of multipolygon with tags on the outer way", function() {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            w = iD.Way({tags: {natural: 'wood'}, nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({members: [{id: w.id}], tags: {type: 'multipolygon'}}),
            graph = iD.Graph([a, b, c, w, r]);

        surface.call(iD.svg.Lines(projection), graph, [w], all);

        expect(surface.select('.stroke')).to.be.classed('tag-natural-wood');
    });

    it("adds stroke classes for the tags of the outer way of multipolygon with tags on the outer way", function() {
        var a = iD.Node({loc: [1, 1]}),
            b = iD.Node({loc: [2, 2]}),
            c = iD.Node({loc: [3, 3]}),
            o = iD.Way({tags: {natural: 'wood'}, nodes: [a.id, b.id, c.id, a.id]}),
            i = iD.Way({nodes: [a.id, b.id, c.id, a.id]}),
            r = iD.Relation({members: [{id: o.id, role: 'outer'}, {id: i.id, role: 'inner'}], tags: {type: 'multipolygon'}}),
            graph = iD.Graph([a, b, c, o, i, r]);

        surface.call(iD.svg.Lines(projection), graph, [i], all);

        expect(surface.select('.stroke')).to.be.classed('tag-natural-wood');
    });

    describe("z-indexing", function() {
        var graph = iD.Graph([
                iD.Node({id: 'a', loc: [0, 0]}),
                iD.Node({id: 'b', loc: [1, 1]}),
                iD.Node({id: 'c', loc: [0, 0]}),
                iD.Node({id: 'd', loc: [1, 1]}),
                iD.Way({id: 'lo', tags: {highway: 'residential', tunnel: 'yes'}, nodes: ['a', 'b']}),
                iD.Way({id: 'hi', tags: {highway: 'residential', bridge: 'yes'}, nodes: ['c', 'd']})
            ]);

        it("stacks higher lines above lower ones in a single render", function () {
            surface.call(iD.svg.Lines(projection), graph, [graph.entity('lo'), graph.entity('hi')], none);

            var selection = surface.selectAll('g.line-stroke > path.line');
            expect(selection[0][0].__data__.id).to.eql('lo');
            expect(selection[0][1].__data__.id).to.eql('hi');
        });

        it("stacks higher lines above lower ones in a single render (reverse)", function () {
            surface.call(iD.svg.Lines(projection), graph, [graph.entity('hi'), graph.entity('lo')], none);

            var selection = surface.selectAll('g.line-stroke > path.line');
            expect(selection[0][0].__data__.id).to.eql('lo');
            expect(selection[0][1].__data__.id).to.eql('hi');
        });

        it("stacks higher lines above lower ones in separate renders", function () {
            surface.call(iD.svg.Lines(projection), graph, [graph.entity('lo')], none);
            surface.call(iD.svg.Lines(projection), graph, [graph.entity('hi')], none);

            var selection = surface.selectAll('g.line-stroke > path.line');
            expect(selection[0][0].__data__.id).to.eql('lo');
            expect(selection[0][1].__data__.id).to.eql('hi');
        });

        it("stacks higher lines above lower in separate renders (reverse)", function () {
            surface.call(iD.svg.Lines(projection), graph, [graph.entity('hi')], none);
            surface.call(iD.svg.Lines(projection), graph, [graph.entity('lo')], none);

            var selection = surface.selectAll('g.line-stroke > path.line');
            expect(selection[0][0].__data__.id).to.eql('lo');
            expect(selection[0][1].__data__.id).to.eql('hi');
        });
    });

});
