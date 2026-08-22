import { select as d3_select } from 'd3-selection';

import { uiToolSplit } from '../../../../modules/ui/tools/split';


describe('iD.uiToolSplit', function() {
    var originalMatchMedia = window.matchMedia;

    afterEach(function() {
        window.matchMedia = originalMatchMedia;
        d3_select(document.body).selectAll('.toolbar-item, .split-test-container').remove();
    });

    function makeFlashRecorder() {
        const flash = vi.fn(() => flash);
        flash.duration = vi.fn(() => flash);
        flash.iconName = vi.fn(() => flash);
        flash.iconClass = vi.fn(() => flash);
        flash.label = vi.fn(() => flash);
        return flash;
    }

    function makeContext(operation, options) {
        const toolbar = d3_select(document.body)
            .append('div')
            .attr('class', 'toolbar-item split');
        const buttonWrap = toolbar.append('div');
        const container = d3_select(document.body)
            .append('div')
            .attr('class', 'split-test-container')
            .attr('pointer', options.pointer || 'mouse');
        const flash = makeFlashRecorder();
        const ui = {
            flash,
            checkOverflow: vi.fn()
        };
        const history = {
            on: vi.fn(() => history)
        };

        const context = {
            container: () => container,
            history: () => history,
            lastPointerType: () => options.lastPointerType || 'mouse',
            map: () => ({
                withinEditableZoom: () => true
            }),
            mode: () => ({
                id: 'select',
                operations: () => [operation]
            }),
            on: vi.fn(() => context),
            ui: () => ui
        };

        return { buttonWrap, context, flash, toolbar };
    }

    function makeSplitOperation(action) {
        const operation = action || function() {};
        operation.id = 'split';
        operation.available = () => true;
        operation.disabled = () => false;
        operation.tooltip = () => 'Split tip';
        operation.annotation = () => 'Split annotation';
        operation.icon = () => '#iD-operation-split';
        operation.title = 'Split';
        operation.interrupts = {};
        return operation;
    }

    it('shows on touch devices even when the pointer attr is still mouse', function() {
        window.matchMedia = () => ({ matches: false });

        const operation = makeSplitOperation();
        const { buttonWrap, context, toolbar } = makeContext(operation, {
            lastPointerType: 'touch',
            pointer: 'mouse'
        });
        const tool = uiToolSplit(context);

        buttonWrap.call(tool.render);

        expect(toolbar.classed('hide')).toBe(false);
        expect(buttonWrap.select('button.split-button').empty()).toBe(false);
    });

    it('keeps split feedback stable when the operation mutates during click', function() {
        window.matchMedia = () => ({ matches: false });

        let called = 0;
        const operation = makeSplitOperation(function() {
            called++;
            operation.icon = () => '#iD-operation-split-mutated';
            operation.title = 'Changed title';
            operation.annotation = () => 'Changed annotation';
        });

        const { buttonWrap, context, flash } = makeContext(operation, {
            lastPointerType: 'touch',
            pointer: 'mouse'
        });
        const tool = uiToolSplit(context);

        buttonWrap.call(tool.render);

        const button = buttonWrap.select('button.split-button').node();
        const pointerUp = new Event('pointerup', { bubbles: true, cancelable: true });
        Object.defineProperty(pointerUp, 'pointerType', { value: 'touch' });

        button.dispatchEvent(pointerUp);
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        expect(called).toBe(1);
        expect(flash.duration).toHaveBeenCalledWith(2000);
        expect(flash.iconName).toHaveBeenCalledWith('#iD-operation-split');
        expect(flash.label).toHaveBeenCalledWith('Split annotation');
    });
});
