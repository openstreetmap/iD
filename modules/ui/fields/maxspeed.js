import * as d3 from 'd3';
import _ from 'lodash';
import { d3combobox } from '../../lib/d3.combobox.js';
import { dataImperial } from '../../../data/index';
import { geoPointInPolygon } from '../../geo/index';
import { utilRebind } from '../../util/rebind';
import { utilGetSetValue } from '../../util/get_set_value';


export function uiFieldMaxspeed(field, context) {
    var dispatch = d3.dispatch('change'),
        entity,
        isImperial,
        unitInput = d3.select(null),
        input = d3.select(null),
        combobox;

    var metricValues = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
        imperialValues = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];


    function maxspeed(selection) {
        combobox = d3combobox();
        var unitCombobox = d3combobox().data(['km/h', 'mph'].map(comboValues));

        input = selection.selectAll('#preset-input-' + field.id)
            .data([0]);

        input = input.enter()
            .append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.id)
            .attr('placeholder', field.placeholder())
            .call(combobox)
            .merge(input);

        input
            .on('change', change)
            .on('blur', change);

        var childNodes = context.graph().childNodes(context.entity(entity.id)),
            loc = childNodes[~~(childNodes.length/2)].loc;

        isImperial = _.some(dataImperial.features, function(f) {
            return _.some(f.geometry.coordinates, function(d) {
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
