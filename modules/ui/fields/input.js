import * as d3 from 'd3';
import { t } from '../../util/locale';
import { dataPhoneFormats } from '../../../data/index';
import { services } from '../../services/index';
import { utilRebind } from '../../util/rebind';
import { utilGetSetValue } from '../../util/get_set_value';

export {
    uiFieldText as uiFieldUrl,
    uiFieldText as uiFieldNumber,
    uiFieldText as uiFieldTel,
    uiFieldText as uiFieldEmail
};


export function uiFieldText(field, context) {
    var dispatch = d3.dispatch('change'),
        nominatim = services.nominatim,
        input,
        entity;


    function i(selection) {
        var fieldId = 'preset-input-' + field.id;

        input = selection.selectAll('input')
            .data([0]);

        input = input.enter()
            .append('input')
            .attr('type', field.type)
            .attr('id', fieldId)
            .attr('placeholder', field.placeholder() || t('inspector.unknown'))
            .merge(input);

        input
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());

        if (field.type === 'tel' && nominatim && entity) {
            var center = entity.extent(context.graph()).center();
            nominatim.countryCode(center, function (err, countryCode) {
                if (err || !dataPhoneFormats[countryCode]) return;
                selection.selectAll('#' + fieldId)
                    .attr('placeholder', dataPhoneFormats[countryCode]);
            });

        } else if (field.type === 'number') {
            input.attr('type', 'text');

            var spinControl = selection.selectAll('.spin-control')
                .data([0]);

            var enter = spinControl.enter()
                .append('div')
                .attr('class', 'spin-control');

            enter
                .append('button')
                .datum(1)
                .attr('class', 'increment')
                .attr('tabindex', -1);

            enter
                .append('button')
                .datum(-1)
                .attr('class', 'decrement')
                .attr('tabindex', -1);

            spinControl = spinControl
                .merge(enter);

            spinControl.selectAll('button')
                .on('click', function(d) {
                    d3.event.preventDefault();
                    var num = parseInt(input.node().value || 0, 10);
                    if (!isNaN(num)) input.node().value = num + d;
                    change()();
                });
        }
    }


    function change(onInput) {
        return function() {
            var t = {};
            t[field.key] = utilGetSetValue(input) || undefined;
            dispatch.call('change', this, t, onInput);
        };
    }


    i.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return i;
    };


    i.tags = function(tags) {
        utilGetSetValue(input, tags[field.key] || '');
    };


    i.focus = function() {
        var node = input.node();
        if (node) node.focus();
    };

    return utilRebind(i, dispatch, 'on');
}
