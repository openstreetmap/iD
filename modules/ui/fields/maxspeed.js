import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import * as countryCoder from '@ideditor/country-coder';

import { uiCombobox } from '../combobox';
import { t } from '../../core/localizer';
import { utilGetSetValue, utilNoAuto, utilRebind, utilTotalExtent } from '../../util';


export function uiFieldMaxspeed(field, context) {
    var dispatch = d3_dispatch('change');
    var unitInput = d3_select(null);
    var input = d3_select(null);
    var _entityIDs = [];
    var _tags;
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


        input = wrap.selectAll('input.maxspeed-number')
            .data([0]);

        input = input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('class', 'maxspeed-number')
            .attr('id', field.domId)
            .call(utilNoAuto)
            .call(speedCombo)
            .merge(input);

        input
            .on('change', change)
            .on('blur', change);

        var loc = combinedEntityExtent().center();
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
            setUnitSuggestions();
            change();
        }
    }


    function setUnitSuggestions() {
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
        var value = utilGetSetValue(input).trim();

        // don't override multiple values with blank string
        if (!value && Array.isArray(_tags[field.key])) return;

        if (!value) {
            tag[field.key] = undefined;
        } else if (isNaN(value) || !_isImperial) {
            tag[field.key] = context.cleanTagValue(value);
        } else {
            tag[field.key] = context.cleanTagValue(value + ' mph');
        }

        dispatch.call('change', this, tag);
    }


    maxspeed.tags = function(tags) {
        _tags = tags;

        var value = tags[field.key];
        var isMixed = Array.isArray(value);

        if (!isMixed) {
            if (value && value.indexOf('mph') >= 0) {
                value = parseInt(value, 10).toString();
                _isImperial = true;
            } else if (value) {
                _isImperial = false;
            }
        }

        setUnitSuggestions();

        utilGetSetValue(input, typeof value === 'string' ? value : '')
            .attr('title', isMixed ? value.filter(Boolean).join('\n') : null)
            .attr('placeholder', isMixed ? t('inspector.multiple_values') : field.placeholder())
            .classed('mixed', isMixed);
    };


    maxspeed.focus = function() {
        input.node().focus();
    };


    maxspeed.entityIDs = function(val) {
        _entityIDs = val;
    };


    function combinedEntityExtent() {
        return _entityIDs && _entityIDs.length && utilTotalExtent(_entityIDs, context.graph());
    }


    return utilRebind(maxspeed, dispatch, 'on');
}
