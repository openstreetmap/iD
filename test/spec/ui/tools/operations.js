import { select as d3_select } from 'd3-selection';

import { uiToolOperations } from '../../../../modules/ui/tools/operations';


describe('iD.uiToolOperations', function() {
    var originalMatchMedia = window.matchMedia;

    afterEach(function() {
        window.matchMedia = originalMatchMedia;
        d3_select(document.body).selectAll('.toolbar-item, .operations-test-container').remove();
    });

    function makeContext(operations, options) {
        options = options || {};
        const toolbar = d3_select(document.body)
            .append('div')
            .attr('class', 'toolbar-item operations');
        const buttonWrap = toolbar.append('div');
        const container = d3_select(document.body)
            .append('div')
            .attr('class', 'operations-test-container');

        const editMenuListeners = {};
        const editMenu = {
            on: vi.fn((name, handler) => { editMenuListeners[name] = handler; return editMenu; })
        };
        const ui = {
            checkOverflow: vi.fn(),
            editMenu: () => editMenu,
            showEditMenu: vi.fn(),
            closeEditMenu: vi.fn()
        };
        const history = { on: vi.fn(() => history) };
        const map = {
            on: vi.fn(() => map),
            withinEditableZoom: () => options.withinEditableZoom !== false
        };
        const graph = {
            hasEntity: (id) => options.entities && options.entities[id]
        };

        const context = {
            container: () => container,
            graph: () => graph,
            history: () => history,
            lastPointerType: () => options.lastPointerType || 'mouse',
            map: () => map,
            mode: () => options.mode || {
                id: 'select',
                operations: () => operations
            },
            on: vi.fn(() => context),
            projection: (loc) => [loc[0] * 10 + 100, loc[1] * 10 + 100],
            selectedIDs: () => options.selectedIDs || [],
            surfaceRect: () => ({ width: 800, height: 600 }),
            ui: () => ui
        };

        return { buttonWrap, context, ui, toolbar, editMenuListeners };
    }

    function makeOperation(id, props) {
        const operation = function() {};
        operation.id = id;
        return Object.assign(operation, props);
    }

    function setMobileViewport(matches) {
        window.matchMedia = vi.fn(() => ({ matches }));
    }


    it('is hidden for mouse input on large screens', function() {
        setMobileViewport(false);
        const { buttonWrap, context, toolbar } = makeContext([makeOperation('split')]);

        uiToolOperations(context).render(buttonWrap);

        expect(toolbar.classed('hide')).toBe(true);
        expect(buttonWrap.selectAll('button').size()).toBe(0);
    });

    it('is shown for touch input while operations are available', function() {
        setMobileViewport(false);
        const { buttonWrap, context, toolbar } = makeContext([makeOperation('split')], { lastPointerType: 'touch' });

        uiToolOperations(context).render(buttonWrap);

        expect(toolbar.classed('hide')).toBe(false);
        expect(buttonWrap.selectAll('button.operations-button').size()).toBe(1);
    });

    it('is shown on small screens', function() {
        setMobileViewport(true);
        const { buttonWrap, context, toolbar } = makeContext([makeOperation('split')]);

        uiToolOperations(context).render(buttonWrap);

        expect(toolbar.classed('hide')).toBe(false);
    });

    it('is hidden when nothing is selected', function() {
        setMobileViewport(true);
        const { buttonWrap, context, toolbar } = makeContext([], { mode: { id: 'browse' } });

        uiToolOperations(context).render(buttonWrap);

        expect(toolbar.classed('hide')).toBe(true);
    });

    it('is hidden when only mouse-only operations are available for touch input', function() {
        setMobileViewport(false);
        const { buttonWrap, context, toolbar } = makeContext([makeOperation('move', { mouseOnly: true })], { lastPointerType: 'touch' });

        uiToolOperations(context).render(buttonWrap);

        expect(toolbar.classed('hide')).toBe(true);
    });

    it('is hidden outside of the editable zoom range', function() {
        setMobileViewport(true);
        const { buttonWrap, context, toolbar } = makeContext([makeOperation('split')], { withinEditableZoom: false });

        uiToolOperations(context).render(buttonWrap);

        expect(toolbar.classed('hide')).toBe(true);
    });

    it('opens the edit menu with the available operations', function() {
        setMobileViewport(false);
        const split = makeOperation('split');
        const move = makeOperation('move', { mouseOnly: true });
        const { buttonWrap, context, ui } = makeContext([split, move], { lastPointerType: 'touch' });

        uiToolOperations(context).render(buttonWrap);
        const button = buttonWrap.select('button');
        // jsdom has no `PointerEvent`, so fake the `pointerType` property
        const pointerup = new MouseEvent('pointerup', { bubbles: true });
        Object.defineProperty(pointerup, 'pointerType', { value: 'touch' });
        button.node().dispatchEvent(pointerup);
        button.node().dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(ui.showEditMenu).toHaveBeenCalledTimes(1);
        const [anchor, triggerType, operations] = ui.showEditMenu.mock.calls[0];
        expect(anchor).toEqual([400, 300]);   // center of the map: nothing is selected
        expect(triggerType).toBe('toolbar-touch');
        expect(operations).toEqual([split]);  // mouse-only operations are not offered on touch
    });

    it('anchors the edit menu at the selection if it is visible', function() {
        setMobileViewport(true);
        const entity = {
            extent: () => iD.geoExtent([10, 10], [30, 20])
        };
        const { buttonWrap, context, ui } = makeContext([makeOperation('split')], {
            selectedIDs: ['w1'],
            entities: { w1: entity }
        });

        uiToolOperations(context).render(buttonWrap);
        buttonWrap.select('button').node().dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(ui.showEditMenu).toHaveBeenCalledTimes(1);
        expect(ui.showEditMenu.mock.calls[0][0]).toEqual([300, 250]);
        expect(ui.showEditMenu.mock.calls[0][1]).toBe('toolbar-mouse');
    });

    it('closes the edit menu when clicked while it is open', function() {
        setMobileViewport(true);
        const { buttonWrap, context, ui, editMenuListeners } = makeContext([makeOperation('split')]);

        uiToolOperations(context).render(buttonWrap);
        editMenuListeners['toggled.operations'](true);
        expect(buttonWrap.select('button').classed('active')).toBe(true);
        expect(buttonWrap.select('button').attr('aria-expanded')).toBe('true');

        buttonWrap.select('button').node().dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(ui.closeEditMenu).toHaveBeenCalledTimes(1);
        expect(ui.showEditMenu).not.toHaveBeenCalled();

        editMenuListeners['toggled.operations'](false);
        expect(buttonWrap.select('button').classed('active')).toBe(false);
    });

    it('removes its listeners when uninstalled', function() {
        setMobileViewport(true);
        const { buttonWrap, context, editMenuListeners } = makeContext([makeOperation('split')]);
        const tool = uiToolOperations(context);

        tool.render(buttonWrap);
        tool.uninstall();

        expect(context.on).toHaveBeenLastCalledWith('enter.operations', null);
        expect(context.history().on).toHaveBeenLastCalledWith('change.operations', null);
        expect(context.map().on).toHaveBeenLastCalledWith('move.operations', null);
        expect(editMenuListeners['toggled.operations']).toBeNull();
    });
});
