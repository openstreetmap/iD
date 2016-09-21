import * as d3 from 'd3';
import _ from 'lodash';
import { rebind } from '../../util/rebind';
import { getSetValue } from '../../util/get_set_value';
import { d3combobox } from '../../lib/d3.combobox.js';
import { pointInPolygon } from '../../geo/index';
import { imperial as imperialData } from '../../../data/index';

export function maxspeed(field, context) {
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

        isImperial = _.some(imperialData.features, function(f) {
            return _.some(f.geometry.coordinates, function(d) {
                return pointInPolygon(loc, d);
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
            isImperial = getSetValue(unitInput) === 'mph';
            getSetValue(unitInput, isImperial ? 'mph' : 'km/h');
            setSuggestions();
            change();
        }
    }


    function setSuggestions() {
        combobox.data((isImperial ? imperialValues : metricValues).map(comboValues));
        getSetValue(unitInput, isImperial ? 'mph' : 'km/h');
    }


    function comboValues(d) {
        return {
            value: d.toString(),
            title: d.toString()
        };
    }


    function change() {
        var tag = {},
            value = getSetValue(input);

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
        getSetValue(input, value || '');
    };


    maxspeed.focus = function() {
        input.node().focus();
    };


    maxspeed.entity = function(_) {
        entity = _;
    };


    return rebind(maxspeed, dispatch, 'on');
}
