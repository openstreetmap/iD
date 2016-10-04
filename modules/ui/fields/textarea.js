import * as d3 from 'd3';
import { t } from '../../util/locale';
import { utilGetSetValue } from '../../util/get_set_value';
import { utilRebind } from '../../util/rebind';


export function uiFieldTextarea(field) {
    var dispatch = d3.dispatch('change'),
        input = d3.select(null);


    function textarea(selection) {
        input = selection.selectAll('textarea')
            .data([0]);

        input = input.enter()
            .append('textarea')
            .attr('id', 'preset-input-' + field.id)
            .attr('placeholder', field.placeholder() || t('inspector.unknown'))
            .attr('maxlength', 255)
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
