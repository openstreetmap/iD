import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../../util/locale';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';


export function uiFieldTextarea(field) {
    var dispatch = d3_dispatch('change'),
        input = d3_select(null);


    function textarea(selection) {
        input = selection.selectAll('textarea')
            .data([0]);

        input = input.enter()
            .append('textarea')
            .attr('id', 'preset-input-' + field.safeid)
            .attr('placeholder', field.placeholder() || t('inspector.unknown'))
            .attr('maxlength', 255)
            .call(utilNoAuto)
            .on('input', change(true))
            .on('blur', change())
            .on('change', change())
            .merge(input);
    }


    function change(onInput) {
        return function() {
            var t = {};
            t[field.key] = utilGetSetValue(input) || undefined;
            dispatch.call('change', this, t, onInput);
        };
    }


    textarea.tags = function(tags) {
        utilGetSetValue(input, tags[field.key] || '');
    };


    textarea.focus = function() {
        input.node().focus();
    };


    return utilRebind(textarea, dispatch, 'on');
}
