import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import * as countryCoder from '@ideditor/country-coder';

import { uiCombobox } from '../combobox';
import { t, localizer } from '../../core/localizer';
import { utilGetSetValue, utilNoAuto, utilRebind, utilTotalExtent } from '../../util';


export function uiFieldRoadheight(field, context) {
    var dispatch = d3_dispatch('change');
    var primaryUnitInput = d3_select(null);
    var primaryInput = d3_select(null);
    var secondaryInput = d3_select(null);
    var secondaryUnitInput = d3_select(null);
    var _entityIDs = [];
    var _tags;
    var _isImperial;
    var formatFloat = localizer.floatFormatter(localizer.languageCode());
    var parseLocaleFloat = localizer.floatParser(localizer.languageCode());

    var primaryUnits = [
        {
            value: 'm',
            title: t('inspector.roadheight.meter'),
        },
        {
            value: 'ft',
            title: t('inspector.roadheight.foot'),
        },
    ];

    var unitCombo = uiCombobox(context, 'roadheight-unit')
        .data(primaryUnits);

    function roadheight(selection) {

        var wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);


        primaryInput = wrap.selectAll('input.roadheight-number')
            .data([0]);

        primaryInput = primaryInput.enter()
            .append('input')
            .attr('type', 'text')
            .attr('class', 'roadheight-number')
            .attr('id', field.domId)
            .call(utilNoAuto)
            .merge(primaryInput);

        primaryInput
            .on('change', change)
            .on('blur', change);

        var loc = combinedEntityExtent().center();
        _isImperial = countryCoder.roadHeightUnit(loc) === 'ft';

        primaryUnitInput = wrap.selectAll('input.roadheight-unit')
            .data([0]);

        primaryUnitInput = primaryUnitInput.enter()
            .append('input')
            .attr('type', 'text')
            .attr('class', 'roadheight-unit')
            .call(unitCombo)
            .merge(primaryUnitInput);

        primaryUnitInput
            .on('blur', changeUnits)
            .on('change', changeUnits);

        secondaryInput = wrap.selectAll('input.roadheight-secondary-number')
            .data([0]);

        secondaryInput = secondaryInput.enter()
            .append('input')
            .attr('type', 'text')
            .attr('class', 'roadheight-secondary-number')
            .call(utilNoAuto)
            .merge(secondaryInput);

        secondaryInput
            .on('change', change)
            .on('blur', change);

        secondaryUnitInput = wrap.selectAll('input.roadheight-secondary-unit')
            .data([0]);
        secondaryUnitInput = secondaryUnitInput.enter()
            .append('input')
            .attr('type', 'text')
            .call(utilNoAuto)
            .classed('disabled', true)
            .classed('roadheight-secondary-unit', true)
            .attr('readonly', 'readonly')
            .merge(secondaryUnitInput);


        function changeUnits() {
            var primaryUnit = utilGetSetValue(primaryUnitInput);
            if (primaryUnit === 'm') {
                _isImperial = false;
            } else if (primaryUnit === 'ft') {
                _isImperial = true;
            }
            utilGetSetValue(primaryUnitInput, _isImperial ? 'ft' : 'm');
            setUnitSuggestions();
            change();
        }
    }


    function setUnitSuggestions() {
        utilGetSetValue(primaryUnitInput, _isImperial ? 'ft' : 'm');
    }


    function change() {
        var tag = {};
        var primaryValue = utilGetSetValue(primaryInput).trim();
        var secondaryValue = utilGetSetValue(secondaryInput).trim();

        // don't override multiple values with blank string
        if (!primaryValue && !secondaryValue && Array.isArray(_tags[field.key])) return;

        if (!primaryValue && !secondaryValue) {
            tag[field.key] = undefined;
        } else {
            var rawPrimaryValue = parseLocaleFloat(primaryValue);
            if (isNaN(rawPrimaryValue)) rawPrimaryValue = primaryValue;
            var rawSecondaryValue = parseLocaleFloat(secondaryValue);
            if (isNaN(rawSecondaryValue)) rawSecondaryValue = secondaryValue;

            if (isNaN(rawPrimaryValue) || isNaN(rawSecondaryValue) || !_isImperial) {
                tag[field.key] = context.cleanTagValue(rawPrimaryValue);
            } else {
                if (rawPrimaryValue !== '') {
                    rawPrimaryValue = rawPrimaryValue + '\'';
                }
                if (rawSecondaryValue !== '') {
                    rawSecondaryValue = rawSecondaryValue + '"';
                }
                tag[field.key] = context.cleanTagValue(rawPrimaryValue + rawSecondaryValue);
            }
        }

        dispatch.call('change', this, tag);
    }


    roadheight.tags = function(tags) {
        _tags = tags;

        var primaryValue = tags[field.key];
        var secondaryValue;
        var isMixed = Array.isArray(primaryValue);

        if (!isMixed) {
            if (primaryValue && (primaryValue.indexOf('\'') >= 0 || primaryValue.indexOf('"') >= 0)) {
                secondaryValue = primaryValue.match(/(-?[\d.]+)"/);
                if (secondaryValue !== null) {
                    secondaryValue = formatFloat(parseFloat(secondaryValue[1]));
                }
                primaryValue = primaryValue.match(/(-?[\d.]+)'/);
                if (primaryValue !== null) {
                    primaryValue = formatFloat(parseFloat(primaryValue[1]));
                }
                _isImperial = true;
            } else if (primaryValue) {
                var rawValue = primaryValue;
                primaryValue = parseFloat(rawValue);
                if (isNaN(primaryValue)) primaryValue = rawValue;
                primaryValue = formatFloat(primaryValue);
                _isImperial = false;
            }
        }

        setUnitSuggestions();

        // If feet are specified but inches are omitted, assume zero inches.
        var inchesPlaceholder = formatFloat(0);

        utilGetSetValue(primaryInput, typeof primaryValue === 'string' ? primaryValue : '')
            .attr('title', isMixed ? primaryValue.filter(Boolean).join('\n') : null)
            .attr('placeholder', isMixed ? t('inspector.multiple_values') : t('inspector.unknown'))
            .classed('mixed', isMixed);
        utilGetSetValue(secondaryInput, typeof secondaryValue === 'string' ? secondaryValue : '')
            .attr('placeholder', isMixed ? t('inspector.multiple_values') : (_isImperial ? inchesPlaceholder : null))
            .classed('mixed', isMixed)
            .classed('disabled', !_isImperial)
            .attr('readonly', _isImperial ? null : 'readonly');
        secondaryUnitInput.attr('value', _isImperial ? t('inspector.roadheight.inch') : null);
    };


    roadheight.focus = function() {
        primaryInput.node().focus();
    };


    roadheight.entityIDs = function(val) {
        _entityIDs = val;
    };


    function combinedEntityExtent() {
        return _entityIDs && _entityIDs.length && utilTotalExtent(_entityIDs, context.graph());
    }


    return utilRebind(roadheight, dispatch, 'on');
}
