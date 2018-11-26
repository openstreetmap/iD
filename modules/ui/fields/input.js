import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
    select as d3_select,
    event as d3_event
} from 'd3-selection';

import { t, textDirection } from '../../util/locale';
import { dataPhoneFormats } from '../../../data';
import { services } from '../../services';
import { tooltip } from '../../util/tooltip';

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
    var input = d3_select(null);
    var _entity;
    var _brandTip;

    if (field.id === 'brand') {
        _brandTip = tooltip().title(t('inspector.lock.brand')).placement('bottom');
    }


    function i(selection) {
        var preset = _entity && context.presets().match(_entity, context.graph());
        var isSuggestion = preset && preset.suggestion && field.id === 'brand';

        var fieldID = 'preset-input-' + field.safeid;

        input = selection.selectAll('input')
            .data([0]);

        input = input.enter()
            .append('input')
            .attr('type', field.type)
            .attr('id', fieldID)
            .attr('placeholder', field.placeholder() || t('inspector.unknown'))
            .classed(field.type, true)
            .call(utilNoAuto)
            .merge(input);

        input
            .classed('disabled', !!isSuggestion)
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());


        if (field.id === 'brand') {
            selection.call(isSuggestion ? _brandTip : _brandTip.destroy);
        }

        if (field.type === 'tel' && nominatim && _entity) {
            var center = _entity.extent(context.graph()).center();
            nominatim.countryCode(center, function (err, countryCode) {
                if (err || !dataPhoneFormats[countryCode]) return;
                selection.selectAll('#' + fieldID)
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
                .attr('class', 'button-input-action minor')
                .classed(rtl ? 'increment' : 'decrement', true)
                .attr('tabindex', -1);

            enter
                .append('button')
                .datum(rtl ? -1 : 1)
                .attr('class', 'button-input-action minor')
                .classed(rtl ? 'decrement' : 'increment', true)
                .attr('tabindex', -1);

            spinControl = spinControl
                .merge(enter);

            spinControl.selectAll('button')
                .on('click', function(d) {
                    d3_event.preventDefault();
                    input.node().value = parsed(input.node().value) + d;
                    change()();
                });

        } else if (preset && field.id === 'brand') {
            var pTag = preset.id.split('/', 2);
            var pKey = pTag[0];
            if (isSuggestion) {
                // A "suggestion" preset (brand name)
                // Put suggestion keys in `field.keys` so delete button can remove them all.
                field.keys = Object.keys(preset.removeTags)
                    .filter(function(k) { return k !== pKey; });
            }
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


    i.entity = function(val) {
        if (!arguments.length) return _entity;
        _entity = val;
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
