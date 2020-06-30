import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';
import { uiCombobox } from './combobox';
import { utilGetSetValue, utilNoAuto } from '../util';


export function uiFormFields(context) {
    var moreCombo = uiCombobox(context, 'more-fields').minItems(1);
    var _fieldsArr = [];
    var _lastPlaceholder = '';
    var _state = '';
    var _klass = '';


    function formFields(selection) {
        var allowedFields = _fieldsArr.filter(function(field) { return field.isAllowed(); });
        var shown = allowedFields.filter(function(field) { return field.isShown(); });
        var notShown = allowedFields.filter(function(field) { return !field.isShown(); });

        var container = selection.selectAll('.form-fields-container')
            .data([0]);

        container = container.enter()
            .append('div')
            .attr('class', 'form-fields-container ' + (_klass || ''))
            .merge(container);


        var fields = container.selectAll('.wrap-form-field')
            .data(shown, function(d) { return d.id + (d.entityIDs ? d.entityIDs.join() : ''); });

        fields.exit()
            .remove();

        // Enter
        var enter = fields.enter()
            .append('div')
            .attr('class', function(d) { return 'wrap-form-field wrap-form-field-' + d.safeid; });

        // Update
        fields = fields
            .merge(enter);

        fields
            .order()
            .each(function(d) {
                d3_select(this)
                    .call(d.render);
            });


        var titles = [];
        var moreFields = notShown.map(function(field) {
            var label = field.label();
            titles.push(label);

            var terms = field.terms();
            if (field.key) terms.push(field.key);
            if (field.keys) terms = terms.concat(field.keys);

            return {
                title: label,
                value: label,
                field: field,
                terms: terms
            };
        });

        var placeholder = titles.slice(0,3).join(', ') + ((titles.length > 3) ? '…' : '');


        var more = selection.selectAll('.more-fields')
            .data((_state === 'hover' || moreFields.length === 0) ? [] : [0]);

        more.exit()
            .remove();

        var moreEnter = more.enter()
            .append('div')
            .attr('class', 'more-fields')
            .append('label');

        moreEnter
            .append('span')
            .text(t('inspector.add_fields'));

        more = moreEnter
            .merge(more);


        var input = more.selectAll('.value')
            .data([0]);

        input.exit()
            .remove();

        input = input.enter()
            .append('input')
            .attr('class', 'value')
            .attr('type', 'text')
            .attr('placeholder', placeholder)
            .call(utilNoAuto)
            .merge(input);

        input
            .call(utilGetSetValue, '')
            .call(moreCombo
                .data(moreFields)
                .on('accept', function (d) {
                    if (!d) return;  // user entered something that was not matched
                    var field = d.field;
                    field.show();
                    selection.call(formFields);  // rerender
                    if (field.type !== 'semiCombo' && field.type !== 'multiCombo') {
                        field.focus();
                    }
                })
            );

        // avoid updating placeholder excessively (triggers style recalc)
        if (_lastPlaceholder !== placeholder) {
            input.attr('placeholder', placeholder);
            _lastPlaceholder = placeholder;
        }
    }


    formFields.fieldsArr = function(val) {
        if (!arguments.length) return _fieldsArr;
        _fieldsArr = val || [];
        return formFields;
    };

    formFields.state = function(val) {
        if (!arguments.length) return _state;
        _state = val;
        return formFields;
    };

    formFields.klass = function(val) {
        if (!arguments.length) return _klass;
        _klass = val;
        return formFields;
    };


    return formFields;
}
