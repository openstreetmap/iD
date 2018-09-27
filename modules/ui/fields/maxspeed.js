import _some from 'lodash-es/some';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { d3combobox as d3_combobox } from '../../lib/d3.combobox.js';

import { dataImperial } from '../../../data';
import { geoPointInPolygon } from '../../geo';
import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';


export function uiFieldMaxspeed(field, context) {
    var dispatch = d3_dispatch('change'),
        entity,
        isImperial,
        unitInput = d3_select(null),
        input = d3_select(null),
        combobox;

    var metricValues = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
        imperialValues = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];


    function maxspeed(selection) {
        combobox = d3_combobox()
            .container(context.container());

        var unitCombobox = d3_combobox()
            .container(context.container())
            .data(['km/h', 'mph'].map(comboValues));

        input = selection.selectAll('#preset-input-' + field.safeid)
            .data([0]);

        input = input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.safeid)
            .attr('placeholder', field.placeholder())
            .call(utilNoAuto)
            .call(combobox)
            .merge(input);

        input
            .on('change', change)
            .on('blur', change);

        var loc;
        if (entity.type === 'node') {
            loc = entity.loc;
        }
        else {
            var childNodes = context.graph().childNodes(context.entity(entity.id));
            loc = childNodes[~~(childNodes.length/2)].loc;
        }

        isImperial = _some(dataImperial.features, function(f) {
            return _some(f.geometry.coordinates, function(d) {
                return geoPointInPolygon(loc, d);
            });
        });

        unitInput = selection.selectAll('input.maxspeed-unit')
            .data([0]);

        unitInput = unitInput.enter()
            .append('input')
            .attr('type', 'text')
            .attr('class', 'maxspeed-unit')
            .call(unitCombobox)
            .merge(unitInput);

        unitInput
            .on('blur', changeUnits)
            .on('change', changeUnits);


        function changeUnits() {
            isImperial = utilGetSetValue(unitInput) === 'mph';
            utilGetSetValue(unitInput, isImperial ? 'mph' : 'km/h');
            setSuggestions();
            change();
        }
    }


    function setSuggestions() {
        combobox.data((isImperial ? imperialValues : metricValues).map(comboValues));
        utilGetSetValue(unitInput, isImperial ? 'mph' : 'km/h');
    }


    function comboValues(d) {
        return {
            value: d.toString(),
            title: d.toString()
        };
    }


    function change() {
        var tag = {},
            value = utilGetSetValue(input);

        if (!value) {
            tag[field.key] = undefined;
        } else if (isNaN(value) || !isImperial) {
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
            isImperial = true;
        } else if (value) {
            isImperial = false;
        }

        setSuggestions();
        utilGetSetValue(input, value || '');
    };


    maxspeed.focus = function() {
        input.node().focus();
    };


    maxspeed.entity = function(_) {
        entity = _;
    };


    return utilRebind(maxspeed, dispatch, 'on');
}
