import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../../core/localizer';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';
import { uiLengthIndicator } from '..';
import { svgIcon } from '../../svg/icon';   // ← ADDED

export function uiFieldTextarea(field, context) {
    var dispatch = d3_dispatch('change');
    var input = d3_select(null);
    var wrap = d3_select(null);              // ← ADDED
    var _lengthIndicator = uiLengthIndicator(context.maxCharsForTagValue())
        .silent(field.usage === 'changeset' && field.key === 'comment');
    var _tags;

    function textarea(selection) {
        wrap = selection.selectAll('.form-field-input-wrap')
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
            .attr('dir', 'auto')
            .attr('id', field.domId)
            .call(utilNoAuto)
            .on('input', function () {
                change(true)();
                updatePatternValidation();    // ← ADDED
            })
            .on('blur', function () {
                change()();
                updatePatternValidation();    // ← ADDED
            })
            .on('change', function () {
                change()();
                updatePatternValidation();    // ← ADDED
            })
            .merge(input);

        wrap.call(_lengthIndicator);

        function change(onInput) {
            return function () {

                var val = utilGetSetValue(input);
                if (!onInput) val = context.cleanTagValue(val);

                // don't override multiple values with blank string
                if (!val && Array.isArray(_tags[field.key])) return;

                var t = {};
                t[field.key] = val || undefined;
                dispatch.call('change', this, t, onInput);
            };
        }
    }
    
    function updatePatternValidation() {
        if (!field.pattern || !wrap || wrap.empty()) return;

        const value = utilGetSetValue(input).trim();

        if (!value) {
            wrap.selectAll('.form-field-pattern-info').remove();
            return;
        }

        let isInvalid = false;
        try {
            const regex = new RegExp(field.pattern);
            isInvalid = !regex.test(value);
        } catch {
            return;
        }

        const info = wrap.selectAll('.form-field-pattern-info')
            .data(isInvalid ? [0] : []);

        const enter = info.enter()
            .append('div')
            .attr('class', 'form-field-pattern-info');

        enter
            .append('span')
            .call(svgIcon('#iD-icon-info'));

        enter
            .append('span')
            .attr('class', 'form-field-pattern-info-text')
            .text(t('inspector.invalid_format'));

        info.exit().remove();
    }
    // ============================


    textarea.tags = function (tags) {
        _tags = tags;

        var isMixed = Array.isArray(tags[field.key]);

        utilGetSetValue(input, !isMixed && tags[field.key] ? tags[field.key] : '')
            .attr('title', isMixed ? tags[field.key].filter(Boolean).join('\n') : undefined)
            .attr('placeholder', isMixed ? t('inspector.multiple_values') : (field.placeholder() || t('inspector.unknown')))
            .classed('mixed', isMixed);

        if (!isMixed) {
            _lengthIndicator.update(tags[field.key]);
        }

        updatePatternValidation();   
    };


    textarea.focus = function () {
        input.node().focus();
    };


    return utilRebind(textarea, dispatch, 'on');
}
