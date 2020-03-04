import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import * as countryCoder from '@ideditor/country-coder';

import { uiCombobox } from '../combobox';
import { utilGetSetValue, utilNoAuto, utilRebind } from '../../util';


export function uiFieldMaxspeed(field, context) {
    var dispatch = d3_dispatch('change');
    var unitInput = d3_select(null);
    var input = d3_select(null);
    var _entity;
    var _isImperial;

    var speedCombo = uiCombobox(context, 'maxspeed');
    var unitCombo = uiCombobox(context, 'maxspeed-unit')
            .data(['km/h', 'mph'].map(comboValues));

    var metricValues = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
    var imperialValues = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];


    function maxspeed(selection) {

        var wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);


        input = wrap.selectAll('#preset-input-' + field.safeid)
            .data([0]);

        input = input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.safeid)
            .attr('placeholder', field.placeholder())
            .call(utilNoAuto)
            .call(speedCombo)
            .merge(input);

        input
            .on('change', change)
            .on('blur', change);

        var loc = _entity.extent(context.graph()).center();

        _isImperial = countryCoder.roadSpeedUnit(loc) === 'mph';

        unitInput = wrap.selectAll('input.maxspeed-unit')
            .data([0]);

        unitInput = unitInput.enter()
            .append('input')
            .attr('type', 'text')
            .attr('class', 'maxspeed-unit')
            .call(unitCombo)
            .merge(unitInput);

        unitInput
            .on('blur', changeUnits)
            .on('change', changeUnits);


        function changeUnits() {
            _isImperial = utilGetSetValue(unitInput) === 'mph';
            utilGetSetValue(unitInput, _isImperial ? 'mph' : 'km/h');
            setSuggestions();
            change();
        }
    }


    function setSuggestions() {
        speedCombo.data((_isImperial ? imperialValues : metricValues).map(comboValues));
        utilGetSetValue(unitInput, _isImperial ? 'mph' : 'km/h');
    }


    function comboValues(d) {
        return {
            value: d.toString(),
            title: d.toString()
        };
    }


    function change() {
        var tag = {};
        var value = utilGetSetValue(input);

        if (!value) {
            tag[field.key] = undefined;
        } else if (isNaN(value) || !_isImperial) {
            tag[field.key] = value;
        } else {
            tag[field.key] = value + ' mph';
        }

        dispatch.call('change', this, tag);
    }


    maxspeed.tags = function(tags) {
        var value = tags[field.key];

        if (value && value.indexOf('mph') >= 0) {
            value = parseInt(value, 10);
            _isImperial = true;
        } else if (value) {
            _isImperial = false;
        }

        setSuggestions();
        utilGetSetValue(input, value || '');
    };


    maxspeed.focus = function() {
        input.node().focus();
    };


    maxspeed.entity = function(val) {
        _entity = val;
    };


    return utilRebind(maxspeed, dispatch, 'on');
}
