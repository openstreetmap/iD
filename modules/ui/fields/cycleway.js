import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { uiCombobox } from '../combobox';
import { utilGetSetValue, utilNoAuto, utilRebind } from '../../util';


export function uiFieldCycleway(field, context) {
    var dispatch = d3_dispatch('change');
    var items = d3_select(null);
    var wrap = d3_select(null);

    function cycleway(selection) {

        function stripcolon(s) {
            return s.replace(':', '');
        }


        wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);


        var div = wrap.selectAll('ul')
            .data([0]);

        div = div.enter()
            .append('ul')
            .attr('class', 'rows')
            .merge(div);

        var keys = ['cycleway:left', 'cycleway:right'];

        items = div.selectAll('li')
            .data(keys);

        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'labeled-input preset-cycleway-' + stripcolon(d); });

        enter
            .append('span')
            .attr('class', 'label preset-label-cycleway')
            .attr('for', function(d) { return 'preset-input-cycleway-' + stripcolon(d); })
            .text(function(d) { return field.t('types.' + d); });

        enter
            .append('div')
            .attr('class', 'preset-input-cycleway-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', function(d) { return 'preset-input-cycleway preset-input-' + stripcolon(d); })
            .call(utilNoAuto)
            .each(function(d) {
                d3_select(this)
                    .call(uiCombobox(context, 'cycleway-' + stripcolon(d))
                        .data(cycleway.options(d))
                    );
            });

        items = items.merge(enter);

        // Update
        wrap.selectAll('.preset-input-cycleway')
            .on('change', change)
            .on('blur', change);
    }


    function change() {
        var left = utilGetSetValue(d3_select('.preset-input-cyclewayleft'));
        var right = utilGetSetValue(d3_select('.preset-input-cyclewayright'));
        var tag = {};

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
        return Object.keys(field.strings.options).map(function(option) {
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
        var node = wrap.selectAll('input').node();
        if (node) node.focus();
    };


    return utilRebind(cycleway, dispatch, 'on');
}
