import { select as d3_select } from 'd3-selection';


describe('iD.rendererMap indoor focus', function() {
    let content;
    let context;
    let surface;

    beforeEach(function() {
        content = d3_select('body').append('div');
        context = iD.coreContext().assetPath('../dist/').init().container(content);
        content.call(context.map());
        context.map()
            .dimensions([1000, 1000])
            .centerZoom([0, 0], 20);
        surface = content.node();
    });

    afterEach(function() {
        content.remove();
    });

    it('keeps the selected indoor level above other floors', function() {
        const selected = new iD.osmNode({
            id: 'n-indoor-selected',
            loc: [0, 0],
            tags: { indoor: 'room', level: '1' }
        });
        const sameLevel = new iD.osmNode({
            id: 'n-indoor-same',
            loc: [0.00001, 0],
            tags: { indoor: 'room', level: '1' }
        });
        const otherLevel = new iD.osmNode({
            id: 'n-indoor-other',
            loc: [0.00002, 0],
            tags: { indoor: 'room', level: '2' }
        });
        const corners = [
            new iD.osmNode({ id: 'n-building-1', loc: [-0.0001, -0.0001] }),
            new iD.osmNode({ id: 'n-building-2', loc: [0.0001, -0.0001] }),
            new iD.osmNode({ id: 'n-building-3', loc: [0.0001, 0.0001] }),
            new iD.osmNode({ id: 'n-building-4', loc: [-0.0001, 0.0001] })
        ];
        const building = new iD.osmWay({
            id: 'w-indoor-building',
            nodes: corners.map(node => node.id).concat(corners[0].id),
            tags: { building: 'yes' }
        });
        const focusedFloor = new iD.osmWay({
            id: 'w-indoor-focused-floor',
            nodes: building.nodes,
            tags: { area: 'yes', indoor: 'level', level: '1' }
        });
        const otherFloor = new iD.osmWay({
            id: 'w-indoor-other-floor',
            nodes: building.nodes,
            tags: { area: 'yes', indoor: 'level', level: '2' }
        });

        context.history().merge([
            selected, sameLevel, otherLevel, ...corners, building, focusedFloor, otherFloor
        ]);

        const layer = d3_select(surface).select('.layer-osm');
        const selectedMark = layer.append('path').datum(selected);
        const sameLevelMark = layer.append('path').datum(sameLevel);
        const otherLevelMark = layer.append('path').datum(otherLevel);
        const buildingMark = layer.append('path').datum(building);

        context.map().redrawEnable(true);
        context.map().pan([0, 0]);

        const areaFill = d3_select(surface).select('.layer-osm.areas .area-fill');
        areaFill.append('path')
            .attr('class', `way area fill ${focusedFloor.id}`)
            .datum(focusedFloor);
        areaFill.append('path')
            .attr('class', `way area fill ${otherFloor.id}`)
            .datum(otherFloor);

        context.enter(iD.modeSelect(context, [selected.id]));

        expect(content.classed('indoor-focus')).toBe(true);
        expect(selectedMark.classed('indoor-dim')).toBe(false);
        expect(sameLevelMark.classed('indoor-dim')).toBe(false);
        expect(buildingMark.classed('indoor-dim')).toBe(false);
        expect(otherLevelMark.classed('indoor-dim')).toBe(true);
        const floorOrder = areaFill.selectAll('path.area').nodes()
            .map(node => node.__data__.id)
            .filter(id => id === focusedFloor.id || id === otherFloor.id);
        expect(floorOrder).toEqual([otherFloor.id, focusedFloor.id]);
    });

    it('does not focus indoor features without level or layer values', function() {
        const selected = new iD.osmNode({
            id: 'n-indoor-no-level',
            loc: [0, 0],
            tags: { indoor: 'room' }
        });
        const other = new iD.osmNode({
            id: 'n-indoor-other',
            loc: [0.00001, 0],
            tags: { indoor: 'room', level: '2' }
        });

        context.history().merge([selected, other]);

        const layer = d3_select(surface).select('.layer-osm');
        const otherMark = layer.append('path').datum(other);

        context.map().redrawEnable(true);
        context.map().pan([0, 0]);
        context.enter(iD.modeSelect(context, [selected.id]));

        expect(content.classed('indoor-focus')).toBe(false);
        expect(otherMark.classed('indoor-dim')).toBe(false);
    });
});
