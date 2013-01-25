describe("iD.svg.Areas", function () {
    var surface,
        projection = Object,
        filter = d3.functor(true);

    beforeEach(function () {
        surface = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            .call(iD.svg.Surface());
    });

    it("adds way and area classes", function () {
        var area = iD.Way({tags: {area: 'yes'}}),
            graph = iD.Graph([area]);

        surface.call(iD.svg.Areas(projection), graph, [area], filter);

        expect(surface.select('path')).to.be.classed('way');
        expect(surface.select('path')).to.be.classed('area');
    });

    it("adds tag classes", function () {
        var area = iD.Way({tags: {area: 'yes', building: 'yes'}}),
            graph = iD.Graph([area]);

        surface.call(iD.svg.Areas(projection), graph, [area], filter);

        expect(surface.select('.area')).to.be.classed('tag-building');
        expect(surface.select('.area')).to.be.classed('tag-building-yes');
    });

    it("adds member classes", function () {
        var area = iD.Way({tags: {area: 'yes'}}),
            relation = iD.Relation({members: [{id: area.id, role: 'outer'}], tags: {type: 'multipolygon'}}),
            graph = iD.Graph([area, relation]);

        surface.call(iD.svg.Areas(projection), graph, [area], filter);

        expect(surface.select('.area')).to.be.classed('member');
        expect(surface.select('.area')).to.be.classed('member-role-outer');
        expect(surface.select('.area')).to.be.classed('member-type-multipolygon');
    });

    it("preserves non-area paths", function () {
        var area = iD.Way({tags: {area: 'yes'}}),
            graph = iD.Graph([area]);

        surface.select('.layer-fill')
            .append('path')
            .attr('class', 'other');

        surface.call(iD.svg.Areas(projection), graph, [area], filter);

        expect(surface.selectAll('.other')[0].length).to.equal(1);
    });

    it("stacks smaller areas above larger ones", function () {
        var graph = iD.Graph({
                'a': iD.Node({id: 'a', loc: [0, 0]}),
                'b': iD.Node({id: 'b', loc: [1, 0]}),
                'c': iD.Node({id: 'c', loc: [1, 1]}),
                'd': iD.Node({id: 'd', loc: [0, 1]}),
                's': iD.Way({area: true, tags: {building: 'yes'}, nodes: ['a', 'b', 'c', 'a']}),
                'l': iD.Way({area: true, tags: {landuse: 'park'}, nodes: ['a', 'b', 'c', 'd', 'a']})
            }),
            areas = [graph.entity('s'), graph.entity('l')];

        surface.call(iD.svg.Areas(projection), graph, areas, filter);

        expect(surface.select('.area:nth-child(1)')).to.be.classed('tag-landuse-park');
        expect(surface.select('.area:nth-child(2)')).to.be.classed('tag-building-yes');
    });
});
