import { select as d3_select } from 'd3-selection';


describe('iD.rendererMap indoor focus', function() {
    let content;
    let context;
    let surface;

    beforeEach(function() {
        iD.prefs('indoor-focus', null);
        window.location.hash = '#background=none';

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
        iD.prefs('indoor-focus', null);
        window.location.hash = '#background=none';
    });


    function corners() {
        return [
            new iD.osmNode({ id: 'n-building-1', loc: [-0.0001, -0.0001] }),
            new iD.osmNode({ id: 'n-building-2', loc: [0.0001, -0.0001] }),
            new iD.osmNode({ id: 'n-building-3', loc: [0.0001, 0.0001] }),
            new iD.osmNode({ id: 'n-building-4', loc: [-0.0001, 0.0001] })
        ];
    }

    function setupFloors() {
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
        const nodes = corners();
        const building = new iD.osmWay({
            id: 'w-indoor-building',
            nodes: nodes.map(node => node.id).concat(nodes[0].id),
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
            selected, sameLevel, otherLevel, ...nodes, building, focusedFloor, otherFloor
        ]);

        const layer = d3_select(surface).select('.layer-osm');
        const marks = {
            selected: layer.append('path').datum(selected),
            sameLevel: layer.append('path').datum(sameLevel),
            otherLevel: layer.append('path').datum(otherLevel),
            building: layer.append('path').datum(building)
        };

        context.map().redrawEnable(true);
        context.map().pan([0, 0]);

        const areaFill = d3_select(surface).select('.layer-osm.areas .area-fill');
        areaFill.append('path')
            .attr('class', `way area fill ${focusedFloor.id}`)
            .datum(focusedFloor);
        areaFill.append('path')
            .attr('class', `way area fill ${otherFloor.id}`)
            .datum(otherFloor);

        return { selected, focusedFloor, otherFloor, marks, areaFill };
    }


    it('is disabled by default', function() {
        expect(context.map().indoorFocus()).toBe(false);
        expect(context.map().indoorFocusStatus()).toEqual({ active: false, levels: [], layers: [] });
    });

    it('does not dim anything while disabled', function() {
        const { selected, marks } = setupFloors();
        context.enter(iD.modeSelect(context, [selected.id]));

        expect(content.classed('indoor-focus')).toBe(false);
        expect(marks.otherLevel.classed('indoor-dim')).toBe(false);
        expect(context.map().indoorFocusStatus().active).toBe(false);
    });

    it('can be enabled from the URL hash', function() {
        content.remove();
        window.location.hash = '#background=none&indoor_focus=true';

        content = d3_select('body').append('div');
        context = iD.coreContext().assetPath('../dist/').init().container(content);
        expect(context.map().indoorFocus()).toBe(true);
    });

    it('can be enabled from a stored preference', function() {
        content.remove();
        iD.prefs('indoor-focus', 'true');

        content = d3_select('body').append('div');
        context = iD.coreContext().assetPath('../dist/').init().container(content);
        expect(context.map().indoorFocus()).toBe(true);
    });

    it('persists the setting in the URL hash and in the preferences', function() {
        context.map().indoorFocus(true);
        expect(iD.utilStringQs(window.location.hash).indoor_focus).toBe('true');
        expect(iD.prefs('indoor-focus')).toBe('true');

        context.map().toggleIndoorFocus();
        expect(context.map().indoorFocus()).toBe(false);
        expect(iD.utilStringQs(window.location.hash).indoor_focus).toBeUndefined();
        expect(iD.prefs('indoor-focus')).toBeNull();
    });

    describe('when enabled', function() {
        beforeEach(function() {
            context.map().indoorFocus(true);
        });

        it('keeps the selected indoor level above other floors', function() {
            const { selected, focusedFloor, otherFloor, marks, areaFill } = setupFloors();

            context.enter(iD.modeSelect(context, [selected.id]));

            expect(content.classed('indoor-focus')).toBe(true);
            expect(marks.selected.classed('indoor-dim')).toBe(false);
            expect(marks.sameLevel.classed('indoor-dim')).toBe(false);
            expect(marks.building.classed('indoor-dim')).toBe(false);
            expect(marks.otherLevel.classed('indoor-dim')).toBe(true);
            const floorOrder = areaFill.selectAll('path.area').nodes()
                .map(node => node.__data__.id)
                .filter(id => id === focusedFloor.id || id === otherFloor.id);
            expect(floorOrder).toEqual([otherFloor.id, focusedFloor.id]);
        });

        it('reports the focused levels and notifies listeners', function() {
            const { selected } = setupFloors();
            const statuses = [];
            context.map().on('changeIndoorFocus.test', status => statuses.push(status));

            context.enter(iD.modeSelect(context, [selected.id]));
            expect(context.map().indoorFocusStatus()).toEqual({ active: true, levels: ['1'], layers: [] });
            expect(statuses.at(-1)).toEqual({ active: true, levels: ['1'], layers: [] });

            context.enter(iD.modeBrowse(context));
            expect(context.map().indoorFocusStatus()).toEqual({ active: false, levels: [], layers: [] });
            expect(statuses.at(-1)).toEqual({ active: false, levels: [], layers: [] });
        });

        it('shows the focused levels in the status line', function() {
            // the status line lives in the `.over-map` container which is created by the ui
            const overMap = content.append('div').attr('class', 'over-map');
            overMap.call(iD.uiIndoorFocusStatus(context));
            const status = overMap.select('.indoor-focus-status');
            expect(status.classed('hide')).toBe(true);

            const { selected } = setupFloors();
            context.enter(iD.modeSelect(context, [selected.id]));
            expect(status.classed('hide')).toBe(false);
            expect(status.select('.label').text()).toBe('Focused on level 1');

            context.enter(iD.modeBrowse(context));
            expect(status.classed('hide')).toBe(true);
        });

        it('stops dimming when disabled again', function() {
            const { selected, marks } = setupFloors();
            context.enter(iD.modeSelect(context, [selected.id]));
            expect(marks.otherLevel.classed('indoor-dim')).toBe(true);

            context.map().indoorFocus(false);
            expect(content.classed('indoor-focus')).toBe(false);
            expect(marks.otherLevel.classed('indoor-dim')).toBe(false);
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

        it('does not focus features which only have a layer tag', function() {
            const nodes = corners();
            const bridge = new iD.osmWay({
                id: 'w-bridge',
                nodes: [nodes[0].id, nodes[1].id],
                tags: { highway: 'residential', bridge: 'yes', layer: '1' }
            });
            const road = new iD.osmWay({
                id: 'w-road',
                nodes: [nodes[2].id, nodes[3].id],
                tags: { highway: 'residential' }
            });

            context.history().merge([...nodes, bridge, road]);

            const layer = d3_select(surface).select('.layer-osm');
            const roadMark = layer.append('path').datum(road);

            context.map().redrawEnable(true);
            context.map().pan([0, 0]);
            context.enter(iD.modeSelect(context, [bridge.id]));

            expect(content.classed('indoor-focus')).toBe(false);
            expect(roadMark.classed('indoor-dim')).toBe(false);
        });
    });
});
