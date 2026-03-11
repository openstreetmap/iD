describe('iD.svgVertices', function () {
    var context;
    var surface;
    var projection = d3.geoProjection(function(x, y) { return [x, -y]; })
        .translate([0, 0])
        .scale(iD.geoZoomToScale(17))
        .clipExtent([[0, 0], [Infinity, Infinity]]);


    beforeEach(function () {
        context = iD.coreContext().assetPath('../dist/').init();
        d3.select(document.createElement('div'))
            .attr('class', 'main-map')
            .call(context.map().centerZoom([0, 0], 17));
        surface = context.surface();
    });


    it('adds the .shared class to vertices that are members of two or more ways', function () {
        var node = new iD.osmNode({loc: [0, 0]});
        var way1 = new iD.osmWay({nodes: [node.id], tags: {highway: 'residential'}});
        var way2 = new iD.osmWay({nodes: [node.id], tags: {highway: 'residential'}});
        var graph = new iD.coreGraph([node, way1, way2]);
        var filter = function() { return true; };
        var extent = iD.geoExtent([0, 0], [1, 1]);

        surface.call(iD.svgVertices(projection, context), graph, [node], filter, extent);
        expect(surface.select('.vertex').classed('shared')).to.be.true;
    });


    // Regression for #11314: disconnected ways with coincident endpoints. The bug was
    // touch-layer DOM order not matching sorted data after selection changed, so the
    // wrong node received pointer events. We assert z-order (last circle = on top) rather
    // than simulating click-drag through behaviorDrag (heavy, flaky in jsdom).
    describe('stacked endpoint hit-target order (#11314)', function () {
        var drawVertices;
        var stackLoc = [0, 0];
        var nodeA, nodeB, nodeOffA, nodeOffB, wayA, wayB;
        var entities, filter, extent;

        function redrawVertices(fullRedraw) {
            surface
                .call(drawVertices.drawSelected, context.graph(), extent)
                .call(drawVertices, context.graph(), entities, filter, extent, fullRedraw);
        }

        function topStackedTouchEntityId() {
            var circles = surface.selectAll('.layer-touch.points circle.vertex.target').nodes()
                .filter(function(node) {
                    var loc = node.__data__.properties.entity.loc;
                    return loc[0] === stackLoc[0] && loc[1] === stackLoc[1];
                });

            expect(circles).to.have.length(2);
            return circles[circles.length - 1].__data__.properties.entity.id;
        }

        beforeEach(function () {
            nodeA = iD.osmNode({ loc: stackLoc });
            nodeB = iD.osmNode({ loc: stackLoc });
            nodeOffA = iD.osmNode({ loc: [1, 0] });
            nodeOffB = iD.osmNode({ loc: [0, 1] });
            wayA = iD.osmWay({ nodes: [nodeA.id, nodeOffA.id], tags: { highway: 'residential' } });
            wayB = iD.osmWay({ nodes: [nodeB.id, nodeOffB.id], tags: { highway: 'service' } });
            entities = [nodeA, nodeB, nodeOffA, nodeOffB, wayA, wayB];

            context.perform(
                iD.actionAddEntity(nodeA),
                iD.actionAddEntity(nodeB),
                iD.actionAddEntity(nodeOffA),
                iD.actionAddEntity(nodeOffB),
                iD.actionAddEntity(wayA),
                iD.actionAddEntity(wayB)
            );

            drawVertices = iD.svgVertices(projection, context);
            filter = function() { return true; };
            extent = iD.geoExtent([-1, -1], [2, 2]);
        });

        it('puts the selected way\'s endpoint on top in the touch layer', function () {
            context.enter(iD.modeSelect(context, [wayA.id]));
            redrawVertices(true);
            expect(topStackedTouchEntityId()).to.equal(nodeA.id);

            context.enter(iD.modeSelect(context, [wayB.id]));
            redrawVertices(true);
            expect(topStackedTouchEntityId()).to.equal(nodeB.id);
        });

        it('reorders touch targets after selection changes via drawSelected', function () {
            context.enter(iD.modeSelect(context, [wayA.id]));
            redrawVertices(true);
            expect(topStackedTouchEntityId()).to.equal(nodeA.id);

            context.enter(iD.modeSelect(context, [wayB.id]));
            surface.call(drawVertices.drawSelected, context.graph(), extent);
            expect(topStackedTouchEntityId()).to.equal(nodeB.id);
        });
    });
});
