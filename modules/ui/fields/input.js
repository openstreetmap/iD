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
        _brandTip = tooltip()
            .title(t('inspector.lock.suggestion', { label: field.label }))
            .placement('bottom');
    }


    function i(selection) {
        var preset = _entity && context.presets().match(_entity, context.graph());
        var isSuggestion = preset && preset.suggestion && field.id === 'brand';

        var wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);

        var fieldID = 'preset-input-' + field.safeid;

        input = wrap.selectAll('input')
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
            .attr('readonly', isSuggestion || null)
            .on('input', change(true))
            .on('blur', change())
            .on('change', change());


        if (field.type === 'tel' && nominatim && _entity) {
            var center = _entity.extent(context.graph()).center();
            nominatim.countryCode(center, function (err, countryCode) {
                if (err || !dataPhoneFormats[countryCode]) return;
                wrap.selectAll('#' + fieldID)
                    .attr('placeholder', dataPhoneFormats[countryCode]);
            });

        } else if (field.type === 'number') {
            var rtl = (textDirection === 'rtl');

            input.attr('type', 'text');

            var buttons = wrap.selectAll('.increment, .decrement')
                .data(rtl ? [1, -1] : [-1, 1]);

            buttons.enter()
                .append('button')
                .attr('tabindex', -1)
                .attr('class', function(d) {
                    var which = (d === 1 ? 'increment' : 'decrement');
                    return 'form-field-button ' + which;
                })
                .merge(buttons)
                .on('click', function(d) {
                    d3_event.preventDefault();
                    var vals = input.node().value.split(';');
                    vals = vals.map(function(v) {
                        var num = parseFloat(v.trim(), 10);
                        return isFinite(num) ? clamped(num + d) : v.trim();
                    });
                    input.node().value = vals.join(';');
                    change()();
                });

        } else if (preset && field.id === 'brand') {
            var pTag = preset.id.split('/', 2);
            var pKey = pTag[0];
            if (isSuggestion) {
                // A "suggestion" preset (brand name)
                // Put suggestion keys in `field.keys` so delete button can remove them all.
                field.keys = Object.keys(preset.removeTags)
                    .filter(function(k) { return k !== pKey && k !== 'name'; });
            }

            wrap.call(isSuggestion ? _brandTip : _brandTip.destroy);
        }
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
                    var vals = val.split(';');
                    vals = vals.map(function(v) {
                        var num = parseFloat(v.trim(), 10);
                        return isFinite(num) ? clamped(num) : v.trim();
                    });
                    val = vals.join(';');
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
