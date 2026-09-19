import { dispatch as d3_dispatch } from 'd3';
import { t } from '../core/localizer';
import { DIVIDE_LIMIT, renderOnCanvas } from '../actions/divide';
import { utilArrayUniq, utilKeybinding, utilNoAuto, utilRebind } from '../util';
import type { uiAsyncModal } from './modal_async';
import type { WayId } from '../osm';

function parseInputValue(_value: string) {
    const value = Math.round(+_value);
    if (Number.isNaN(value)) return 1;
    return Math.min(Math.max(value, 1), DIVIDE_LIMIT);
}

export function uiDividePreview(context: iD.Context, modal: uiAsyncModal, entityID: WayId) {
    const dispatch = d3_dispatch('change');

    let _canvas: d3.Selection<HTMLCanvasElement>;
    const state = { long_length: 1, short_length: 1, isValid: true };

    function renderPreviewCanvas(this: any) {
        const projection = context.projection;
        const graph = context.graph();
        const originalWay = graph.entity(entityID);
        const originalNodes = utilArrayUniq(graph.childNodes(originalWay));
        const points = originalNodes.map(n => projection(n.loc));

        const canvas = _canvas.node();
        if (!canvas) return; // should be impossible

        try {
            state.isValid = renderOnCanvas(state.short_length, state.long_length, points, canvas);
        } catch {
            state.isValid = false;
        }
        dispatch.call('change', this, state);
    }

    const createInput = (selection: d3.Selection<HTMLFormElement>, key: 'short_length' | 'long_length') => {
        return selection
            .append('input')
            .attr('type', 'number')
            .attr('step', '1')
            .attr('min', '1')
            .attr('max', DIVIDE_LIMIT)
            .attr('aria-label', t(`operations.divide.${key}`))
            .attr('value', state[key])
            .on('keydown.divide-input', function (event) {
                // fast submit
                if (event.keyCode === utilKeybinding.keyCodes.enter) {
                    return modal.close(true);
                }
            })
            .on('input.divide-input', function (event) {
                state[key] = parseInputValue(event.target.value);
                renderPreviewCanvas.call(this);
            })
            .on('blur.divide-input', renderPreviewCanvas)
            // @ts-expect-error -- fixed in a conflicting PR
            .call(utilNoAuto);
    };

    const render = (selection: d3.Selection) => {
        const form = selection
            .append('form')
            .attr('class', 'divide-modal');

        _canvas = selection
            .append('canvas')
            .style('width', '100%')
            .style('min-height', '300px');


        const long = createInput(form, 'long_length');

        form
            .append('span')
            .text('×');

        createInput(form, 'short_length');

        // focus the first input field
        long.node()?.focus();
        long.node()?.select();

        renderPreviewCanvas();
    };

    return utilRebind(render, dispatch, 'on');
}
