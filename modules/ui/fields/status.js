import { dispatch as d3_dispatch } from 'd3-dispatch';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { osmEntity } from '../../osm/entity';
import { t } from '../../util/locale';
import { services } from '../../services';
import { uiCombobox } from '../index';
import { utilArrayUniq, utilGetSetValue, utilNoAuto, utilRebind } from '../../util';


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
            var v = t('inspector.status.' + k);
            return {
                key: k,
                value: v,
                title: v
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

        var presetTags = _preset.tags;
        for (var key in presetTags) {
            for (var i in options) {
                var status = options[i];
                var combinedKey = status === 'active' ? key : (status + ':' + key);
                if (newStatus === status) {
                    t[combinedKey] = presetTags[key];
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
        utilGetSetValue(input, t('inspector.status.' +  status(tags)));
    };

    function status(tags) {
        var matchingStatuses = {};
        for (var presetKey in _preset.tags) {
            if (!tags[presetKey]) {
                for (var i in statuses) {
                    var status = statuses[i];
                    if (tags[status + ':' + presetKey]) {
                        matchingStatuses[status] = true;
                    }
                }
            }
        }
        var matchingStatusesArray = Object.keys(matchingStatuses);
        if (matchingStatusesArray.length === 1) {
            return matchingStatusesArray[0];
        } else if (matchingStatusesArray.length > 1) {
            return 'mixed';
        }
        return 'active';
    }


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
