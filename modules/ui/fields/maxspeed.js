import { rebind } from '../../util/rebind';
import { getSetValue } from '../../util/get_set_value';
import { d3combobox } from '../../../js/lib/d3.combobox.js';
import * as d3 from 'd3';
import _ from 'lodash';
import { pointInPolygon } from '../../geo/index';
import { imperial as imperialData } from '../../../data/index';

export function maxspeed(field, context) {
    var dispatch = d3.dispatch('change'),
        entity,
        imperial,
        unitInput,
        combobox,
        input;

    var metricValues = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
        imperialValues = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];

    function maxspeed(selection) {
        combobox = d3combobox();
        var unitCombobox = d3combobox().data(['km/h', 'mph'].map(comboValues));

        input = selection.selectAll('#preset-input-' + field.id)
            .data([0]);

        input.enter().append('input')
            .attr('type', 'text')
            .attr('id', 'preset-input-' + field.id)
            .attr('placeholder', field.placeholder());

        input
            .call(combobox)
            .on('change', change)
            .on('blur', change);

        var childNodes = context.graph().childNodes(context.entity(entity.id)),
            loc = childNodes[~~(childNodes.length/2)].loc;

        imperial = _.some(imperialData.features, function(f) {
            return _.some(f.geometry.coordinates, function(d) {
                return pointInPolygon(loc, d);
            });
        });

        unitInput = selection.selectAll('input.maxspeed-unit')
            .data([0]);

        unitInput.enter().append('input')
            .attr('type', 'text')
            .attr('class', 'maxspeed-unit');

        unitInput
            .on('blur', changeUnits)
            .on('change', changeUnits)
            .call(unitCombobox);

        function changeUnits() {
            imperial = getSetValue(unitInput) === 'mph';
            getSetValue(unitInput, imperial ? 'mph' : 'km/h');
            setSuggestions();
            change();
        }

    }

    function setSuggestions() {
        combobox.data((imperial ? imperialValues : metricValues).map(comboValues));
        getSetValue(unitInput, imperial ? 'mph' : 'km/h');
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
        } else if (isNaN(value) || !imperial) {
            tag[field.key] = value;
        } else {
            tag[field.key] = value + ' mph';
        }

        dispatch.call("change", this, tag);
    }

    maxspeed.tags = function(tags) {
        var value = tags[field.key];

        if (value && value.indexOf('mph') >= 0) {
            value = parseInt(value, 10);
            imperial = true;
        } else if (value) {
            imperial = false;
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
