import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import * as countryCoder from '@ideditor/country-coder';

import { uiCombobox } from '../combobox';
import { t, localizer } from '../../core/localizer';
import { utilGetSetValue, utilNoAuto, utilRebind, utilTotalExtent } from '../../util';


export function uiFieldRoadspeed(field, context) {
    var dispatch = d3_dispatch('change');
    var unitInput = d3_select(null);
    var input = d3_select(null);
    var _entityIDs = [];
    var _tags;
    var _isImperial;
    var formatFloat = localizer.floatFormatter(localizer.languageCode());
    var parseLocaleFloat = localizer.floatParser(localizer.languageCode());

    var speedCombo = uiCombobox(context, 'roadspeed');
    var unitCombo = uiCombobox(context, 'roadspeed-unit')
            .data(['km/h', 'mph'].map(comboValues));

    var metricValues = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
    var imperialValues = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];


    function roadspeed(selection) {

        var wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);


        input = wrap.selectAll('input.roadspeed-number')
            .data([0]);

        input = input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('class', 'roadspeed-number')
            .attr('id', field.domId)
            .call(utilNoAuto)
            .call(speedCombo)
            .merge(input);

        input
            .on('change', change)
            .on('blur', change);

        var loc = combinedEntityExtent().center();
        _isImperial = countryCoder.roadSpeedUnit(loc) === 'mph';

        unitInput = wrap.selectAll('input.roadspeed-unit')
            .data([0]);

        unitInput = unitInput.enter()
            .append('input')
            .attr('type', 'text')
            .attr('class', 'roadspeed-unit')
            .attr('aria-label', t('inspector.speed_unit'))
            .call(unitCombo)
            .merge(unitInput);

        unitInput
            .on('blur', changeUnits)
            .on('change', changeUnits);


        function changeUnits() {
            var unit = utilGetSetValue(unitInput);
            if (unit === 'km/h') {
                _isImperial = false;
            } else if (unit === 'mph') {
                _isImperial = true;
            }
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
            value: formatFloat(d),
            title: formatFloat(d)
        };
    }


    function change() {
        var tag = {};
        var value = utilGetSetValue(input).trim();

        // don't override multiple values with blank string
        if (!value && Array.isArray(_tags[field.key])) return;

        if (!value) {
            tag[field.key] = undefined;
        } else {
            var rawValue = parseLocaleFloat(value);
            if (isNaN(rawValue)) rawValue = value;
            if (isNaN(rawValue) || !_isImperial) {
                tag[field.key] = context.cleanTagValue(rawValue);
            } else {
                tag[field.key] = context.cleanTagValue(rawValue + ' mph');
            }
        }

        dispatch.call('change', this, tag);
    }


    roadspeed.tags = function(tags) {
        _tags = tags;

        var rawValue = tags[field.key];
        var value = rawValue;
        var isMixed = Array.isArray(value);

        if (!isMixed) {
            if (rawValue && rawValue.indexOf('mph') >= 0) {
                _isImperial = true;
            } else if (rawValue) {
                _isImperial = false;
            }

            value = parseInt(value, 10);
            if (isNaN(value)) value = rawValue;
            value = formatFloat(value);
        }

        setUnitSuggestions();

        utilGetSetValue(input, typeof value === 'string' ? value : '')
            .attr('title', isMixed ? value.filter(Boolean).join('\n') : null)
            .attr('placeholder', isMixed ? t('inspector.multiple_values') : field.placeholder())
            .classed('mixed', isMixed);
    };


    roadspeed.focus = function() {
        input.node().focus();
    };


    roadspeed.entityIDs = function(val) {
        _entityIDs = val;
    };


    function combinedEntityExtent() {
        return _entityIDs && _entityIDs.length && utilTotalExtent(_entityIDs, context.graph());
    }


    return utilRebind(roadspeed, dispatch, 'on');
}
