import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import * as countryCoder from '@rapideditor/country-coder';

import { uiCombobox } from '../combobox';
import { t, localizer } from '../../core/localizer';
import { utilGetSetValue, utilNoAuto, utilRebind, utilTotalExtent } from '../../util';
import { likelyRawNumberFormat } from './input';


export function uiFieldRoadspeed(field, context) {
    const dispatch = d3_dispatch('change');
    let unitInput = d3_select(null);
    let input = d3_select(null);
    let _entityIDs = [];
    let _tags;
    let _isImperial;
    const formatFloat = localizer.floatFormatter(localizer.languageCode());
    const parseLocaleFloat = localizer.floatParser(localizer.languageCode());

    const speedCombo = uiCombobox(context, 'roadspeed');
    const unitCombo = uiCombobox(context, 'roadspeed-unit')
            .data(['km/h', 'mph'].map(comboValues));

    const metricValues = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
    const imperialValues = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];


    function roadspeed(selection) {

        let wrap = selection.selectAll('.form-field-input-wrap')
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

        const loc = combinedEntityExtent().center();
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
            const unit = utilGetSetValue(unitInput);
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
        const tag = {};
        const value = utilGetSetValue(input).trim();

        // don't override multiple values with blank string
        if (!value && Array.isArray(_tags[field.key])) return;

        if (!value) {
            tag[field.key] = undefined;
        } else {
            let rawValue = likelyRawNumberFormat.test(value)
                ? parseFloat(value)
                : parseLocaleFloat(value);
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

        const rawValue = tags[field.key];
        let value = rawValue;
        const isMixed = Array.isArray(value);

        if (!isMixed) {
            if (rawValue && rawValue.indexOf('mph') >= 0) {
                _isImperial = true;
            } else if (rawValue) {
                _isImperial = false;
            }

            value = parseInt(value, 10);
            if (isNaN(value)) {
                value = rawValue;
            } else {
                value = formatFloat(value);
            }
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
