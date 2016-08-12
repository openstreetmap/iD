import { rebind } from '../../util/rebind';
import * as d3 from 'd3';
import { t } from '../../util/locale';

export function textarea(field) {
    var dispatch = d3.dispatch('change'),
        input;

    function textarea(selection) {
        input = selection.selectAll('textarea')
            .data([0]);

        input.enter().append('textarea')
            .attr('id', 'preset-input-' + field.id)
            .attr('placeholder', field.placeholder() || t('inspector.unknown'))
            .attr('maxlength', 255);

        input
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());
    }

    function change(onInput) {
        return function() {
            var t = {};
            t[field.key] = getSetValue(input) || undefined;
            dispatch.call("change", this, t, onInput);
        };
    }

    textarea.tags = function(tags) {
        getSetValue(input, tags[field.key] || '');
    };

    textarea.focus = function() {
        input.node().focus();
    };

    return rebind(textarea, dispatch, 'on');
}
