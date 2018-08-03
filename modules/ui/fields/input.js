import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event } from 'd3-selection';

import { t, textDirection } from '../../util/locale';
import { dataPhoneFormats } from '../../../data';
import { services } from '../../services';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';


export {
    uiFieldText as uiFieldUrl,
    uiFieldText as uiFieldNumber,
    uiFieldText as uiFieldTel,
    uiFieldText as uiFieldEmail
};


export function uiFieldText(field, context) {
    var dispatch = d3_dispatch('change');
    var nominatim = services.geocoder;
    var input;
    var entity;


    function i(selection) {
        var fieldId = 'preset-input-' + field.safeid;

        input = selection.selectAll('input')
            .data([0]);

        input = input.enter()
            .append('input')
            .attr('type', field.type)
            .attr('id', fieldId)
            .attr('placeholder', field.placeholder() || t('inspector.unknown'))
            .call(utilNoAuto)
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
            var rtl = (textDirection === 'rtl');

            input.attr('type', 'text');

            var spinControl = selection.selectAll('.spin-control')
                .data([0]);

            var enter = spinControl.enter()
                .append('div')
                .attr('class', 'spin-control');

            enter
                .append('button')
                .datum(rtl ? 1 : -1)
                .attr('class', rtl ? 'increment' : 'decrement')
                .attr('tabindex', -1);

            enter
                .append('button')
                .datum(rtl ? -1 : 1)
                .attr('class', rtl ? 'decrement' : 'increment')
                .attr('tabindex', -1);

            spinControl = spinControl
                .merge(enter);

            spinControl.selectAll('button')
                .on('click', function(d) {
                    d3_event.preventDefault();
                    input.node().value = parsed(input.node().value) + d;
                    change()();
                });
        }
    }


    // parse as a number
    function parsed(val) {
        return parseFloat(val || 0, 10) || 0;
    }

    // clamp number to min/max
    function clamped(num) {
        if (field.minValue !== undefined) {
            num = Math.max(num, field.minValue);
        }
        if (field.maxValue !== undefined) {
            num = Math.min(num, field.maxValue);
        }
        return num;
    }


    function change(onInput) {
        return function() {
            var t = {};
            var val = utilGetSetValue(input).trim() || undefined;

            if (!onInput) {
                if (field.type === 'number' && val !== undefined) {
                    val = clamped(parsed(val)) + '';
                }
                utilGetSetValue(input, val || '');
            }
            t[field.key] = val;
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
