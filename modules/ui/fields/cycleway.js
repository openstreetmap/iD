import _keys from 'lodash-es/keys';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';
import { d3combobox as d3_combobox } from '../../lib/d3.combobox.js';

import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';


export function uiFieldCycleway(field, context) {
    var dispatch = d3_dispatch('change'),
        items = d3_select(null);


    function cycleway(selection) {

        function stripcolon(s) {
            return s.replace(':', '');
        }


        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'cf preset-input-wrap')
            .merge(wrap);


        var div = wrap.selectAll('ul')
            .data([0]);

        div = div.enter()
            .append('ul')
            .merge(div);


        items = div.selectAll('li')
            .data(field.keys);

        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'cf preset-cycleway-' + stripcolon(d); });

        enter
            .append('span')
            .attr('class', 'col6 label preset-label-cycleway')
            .attr('for', function(d) { return 'preset-input-cycleway-' + stripcolon(d); })
            .text(function(d) { return field.t('types.' + d); });

        enter
            .append('div')
            .attr('class', 'col6 preset-input-cycleway-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', function(d) { return 'preset-input-cycleway preset-input-' + stripcolon(d); })
            .call(utilNoAuto)
            .each(function(d) {
                d3_select(this)
                    .call(d3_combobox()
                        .container(context.container())
                        .data(cycleway.options(d))
                    );
            });


        // Update
        wrap.selectAll('.preset-input-cycleway')
            .on('change', change)
            .on('blur', change);
    }


    function change() {
        var left = utilGetSetValue(d3_select('.preset-input-cyclewayleft')),
            right = utilGetSetValue(d3_select('.preset-input-cyclewayright')),
            tag = {};

        if (left === 'none' || left === '') { left = undefined; }
        if (right === 'none' || right === '') { right = undefined; }

        // Always set both left and right as changing one can affect the other
        tag = {
            cycleway: undefined,
            'cycleway:left': left,
            'cycleway:right': right
        };

        // If the left and right tags match, use the cycleway tag to tag both
        // sides the same way
        if (left === right) {
            tag = {
                cycleway: left,
                'cycleway:left': undefined,
                'cycleway:right': undefined
            };
        }

        dispatch.call('change', this, tag);
    }


    cycleway.options = function() {
        return _keys(field.strings.options).map(function(option) {
            return {
                title: field.t('options.' + option + '.description'),
                value: option
            };
        });
    };


    cycleway.tags = function(tags) {
        utilGetSetValue(items.selectAll('.preset-input-cycleway'), function(d) {
                // If cycleway is set, always return that
                if (tags.cycleway) {
                    return tags.cycleway;
                }
                return tags[d] || '';
            })
            .attr('placeholder', field.placeholder());
    };


    cycleway.focus = function() {
        items.selectAll('.preset-input-cycleway')
            .node().focus();
    };


    return utilRebind(cycleway, dispatch, 'on');
}
