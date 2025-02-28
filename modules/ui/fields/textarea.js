import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../../core/localizer';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';
import { uiLengthIndicator } from '..';


export function uiFieldTextarea(field, context) {
    const dispatch = d3_dispatch('change');
    let input = d3_select(null);
    const _lengthIndicator = uiLengthIndicator(context.maxCharsForTagValue())
        .silent(field.usage === 'changeset' && field.key === 'comment');
    let _tags;


    function textarea(selection) {
        let wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .style('position', 'relative')
            .merge(wrap);

        input = wrap.selectAll('textarea')
            .data([0]);

        input = input.enter()
            .append('textarea')
            .attr('id', field.domId)
            .call(utilNoAuto)
            .on('input', change(true))
            .on('blur', change())
            .on('change', change())
            .merge(input);

        wrap.call(_lengthIndicator);

        function change(onInput) {
            return function() {

                let val = utilGetSetValue(input);
                if (!onInput) val = context.cleanTagValue(val);

                // don't override multiple values with blank string
                if (!val && Array.isArray(_tags[field.key])) return;

                const t = {};
                t[field.key] = val || undefined;
                dispatch.call('change', this, t, onInput);
            };
        }
    }


    textarea.tags = function(tags) {
        _tags = tags;

        const isMixed = Array.isArray(tags[field.key]);

        utilGetSetValue(input, !isMixed && tags[field.key] ? tags[field.key] : '')
            .attr('title', isMixed ? tags[field.key].filter(Boolean).join('\n') : undefined)
            .attr('placeholder', isMixed ? t('inspector.multiple_values') : (field.placeholder() || t('inspector.unknown')))
            .classed('mixed', isMixed);

        if (!isMixed) {
            _lengthIndicator.update(tags[field.key]);
        }
    };


    textarea.focus = function() {
        input.node().focus();
    };


    return utilRebind(textarea, dispatch, 'on');
}
