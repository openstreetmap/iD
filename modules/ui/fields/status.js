import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { t } from '../../util/locale';
import { uiCombobox } from '../index';
import { utilGetSetValue, utilLifecycleStatusForTags, utilNoAuto, utilRebind } from '../../util';


export function uiFieldStatus(field, context) {
    var dispatch = d3_dispatch('change');

    var statuses = ['proposed', 'construction', 'disused', 'abandoned'];
    var options = ['active'].concat(statuses);

    var combobox = uiCombobox(context, 'status-' + field.safeid);
    var container = d3_select(null);
    var input = d3_select(null);
    var _comboData = [];
    var _entity, _preset;


    function initCombo(selection, attachTo) {
        selection.attr('readonly', 'readonly');
        selection.call(combobox, attachTo);

        _comboData = options.map(function(k) {
            return {
                key: k,
                value: t('inspector.status.' + k + '.title'),
                title: t('inspector.status.' + k + '.description')
            };
        });

        combobox.data(_comboData);
    }

    function change() {
        var t = {};

        var displayVal = utilGetSetValue(input);
        var newStatus = _comboData.find(function(o) {
            return o.key && o.value === displayVal;
        }).key;

        var presetTags = _preset.addTags;
        for (var key in presetTags) {
            for (var i in options) {
                var status = options[i];
                var combinedKey = status === 'active' ? key : (status + ':' + key);
                if (newStatus === status) {
                    if (presetTags[key] === '*') {
                        var value = _entity.hasTagWithAnyStatusForKey(key);
                        if (value) {
                            t[combinedKey] = value;
                        } else {
                            t[combinedKey] = 'yes';
                        }
                    } else {
                        t[combinedKey] = presetTags[key];
                    }
                } else {
                    t[combinedKey] = undefined;
                }
            }
        }

        dispatch.call('change', this, t);
    }


    function combo(selection) {

        container = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        container = container.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-status')
            .merge(container);

        input = container.selectAll('input')
            .data([0]);

        input = input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.safeid)
            .call(utilNoAuto)
            .call(initCombo, selection)
            .merge(input);

        input
            .on('change', change)
            .on('blur', change);

        input
            .on('keydown.field', function() {
                switch (d3_event.keyCode) {
                    case 13: // ↩ Return
                        input.node().blur(); // blurring also enters the value
                        d3_event.stopPropagation();
                        break;
                }
            });
    }


    combo.tags = function(tags) {
        var status = utilLifecycleStatusForTags(tags, _preset);
        utilGetSetValue(input, t('inspector.status.' + status + '.title'));
    };


    combo.focus = function() {
        input.node().focus();
    };


    combo.entity = function(val) {
        if (!arguments.length) return _entity;
        _entity = val;
        _preset = context.presets().match(_entity, context.graph());
        return combo;
    };


    return utilRebind(combo, dispatch, 'on');
}
