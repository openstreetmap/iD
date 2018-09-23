import { select as d3_select } from 'd3-selection';
import { d3combobox as d3_combobox } from '../lib/d3.combobox.js';

import { t } from '../util/locale';
import { utilGetSetValue, utilNoAuto } from '../util';


export function uiFormFields(context) {
    var _fieldsArr;


    function formFields(selection, klass) {
        render(selection, klass);
    }


    function render(selection, klass) {
        var shown = _fieldsArr.filter(function(field) { return field.isShown(); });
        var notShown = _fieldsArr.filter(function(field) { return !field.isShown(); });

        var container = selection.selectAll('.form-fields-container')
            .data([0]);

        container = container.enter()
            .append('div')
            .attr('class', 'form-fields-container ' + (klass || ''))
            .merge(container);


        var fields = container.selectAll('.wrap-form-field')
            .data(shown, function(d) { return d.id + (d.entityID || ''); });

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


        notShown = notShown.map(function(field) {
            return {
                title: field.label(),
                value: field.label(),
                field: field
            };
        });


        var more = selection.selectAll('.more-fields')
            .data((notShown.length > 0) ? [0] : []);

        more.exit()
            .remove();

        more = more.enter()
            .append('div')
            .attr('class', 'more-fields')
            .append('label')
            .text(t('inspector.add_fields'))
            .merge(more);


        var input = more.selectAll('.value')
            .data([0]);

        input.exit()
            .remove();

        input = input.enter()
            .append('input')
            .attr('class', 'value')
            .attr('type', 'text')
            .call(utilNoAuto)
            .merge(input);

        input
            .call(utilGetSetValue, '')
            .attr('placeholder', function() {
                var placeholder = [];
                for (var field in notShown) {
                    placeholder.push(notShown[field].title);
                }
                return placeholder.slice(0,3).join(', ') + ((placeholder.length > 3) ? '…' : '');
            })
            .call(d3_combobox()
                .container(context.container())
                .data(notShown)
                .minItems(1)
                .on('accept', function (d) {
                    var field = d.field;
                    field.show();
                    render(selection);
                    if (field.type !== 'semiCombo' && field.type !== 'multiCombo') {
                        field.focus();
                    }
                })
            );
    }


    formFields.fieldsArr = function(val) {
        if (!arguments.length) return _fieldsArr;
        _fieldsArr = val;
        return formFields;
    };


    return formFields;
}
