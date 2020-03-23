import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../../util/locale';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';


export function uiFieldTextarea(field, context) {
    var dispatch = d3_dispatch('change');
    var input = d3_select(null);
    var _tags;


    function textarea(selection) {
        var wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);

        input = wrap.selectAll('textarea')
            .data([0]);

        input = input.enter()
            .append('textarea')
            .attr('id', field.domId)
            .attr('maxlength', context.maxCharsForTagValue())
            .call(utilNoAuto)
            .on('input', change(true))
            .on('blur', change())
            .on('change', change())
            .merge(input);
    }


    function change(onInput) {
        return function() {

            var val = utilGetSetValue(input) || undefined;

            // don't override multiple values with blank string
            if (!val && Array.isArray(_tags[field.key])) return;

            var t = {};
            t[field.key] = val;
            dispatch.call('change', this, t, onInput);
        };
    }


    textarea.tags = function(tags) {
        _tags = tags;

        var isMixed = Array.isArray(tags[field.key]);

        utilGetSetValue(input, !isMixed && tags[field.key] ? tags[field.key] : '')
            .attr('title', isMixed ? tags[field.key].filter(Boolean).join('\n') : undefined)
            .attr('placeholder', isMixed ? t('inspector.multiple_values') : (field.placeholder() || t('inspector.unknown')))
            .classed('mixed', isMixed);
    };


    textarea.focus = function() {
        input.node().focus();
    };


    return utilRebind(textarea, dispatch, 'on');
}
