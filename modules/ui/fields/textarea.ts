import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../../core/localizer';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';
import { uiLengthIndicator } from '..';
import type { CreateUiField, FieldImpl } from '../field';


export const uiFieldTextarea: CreateUiField = (field, context) => {
    var dispatch = d3_dispatch('change');
    var input = d3_select<HTMLTextAreaElement, 0>(null!);
    var _lengthIndicator = uiLengthIndicator<HTMLDivElement>(context.maxCharsForTagValue())
        .silent(field.usage === 'changeset' && field.key === 'comment');
    var _tags: Tags;


    const textarea: FieldImpl = (selection) => {
        var wrap = selection.selectAll<HTMLDivElement, 0>('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .style('position', 'relative')
            .merge(wrap);

        input = wrap.selectAll<HTMLTextAreaElement, 0>('textarea')
            .data([0]);

        input = input.enter()
            .append('textarea')
            .attr('dir', 'auto')
            .attr('id', field.domId)
            .call(utilNoAuto)
            .on('input', change(true))
            .on('blur', change())
            .on('change', change())
            .merge(input);

        wrap.call(_lengthIndicator);

        function change(onInput?: boolean) {
            return function(this: any) {

                var val = utilGetSetValue(input);
                if (!onInput) val = context.cleanTagValue(val);

                // don't override multiple values with blank string
                if (!val && Array.isArray(_tags[field.key!])) return;

                var t: TagsUpdate = {};
                t[field.key!] = val || undefined;
                dispatch.call('change', this, t, onInput);
            };
        }
    };


    textarea.tags = function(tags) {
        _tags = tags;

        const value = tags[field.key!];

        utilGetSetValue(input, !Array.isArray(value) && value ? value : '')
            .attr('title', Array.isArray(value) ? value.filter(Boolean).join('\n') : null)
            .attr('placeholder', Array.isArray(value) ? t('inspector.multiple_values') : (field.placeholder() || t('inspector.unknown')))
            .classed('mixed', Array.isArray(value));

        if (!Array.isArray(value)) {
            _lengthIndicator.update(value);
        }
    } as FieldImpl['tags'];


    textarea.focus = function() {
        input.node()!.focus();
    };


    return utilRebind(textarea, dispatch, 'on');
};
