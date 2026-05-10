import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { utilRebind } from '../../util';
import { uiFieldCombo } from './combo';


export function uiFieldSegregatedCombo(field, context) {
    var dispatch = d3_dispatch('change');
    var items = d3_select(null);
    var wrap = d3_select(null);

    /** @type {Record<string, ReturnType<typeof uiFieldCombo>>} */
    const _combos = {};


    function segregatedCombo(selection) {

        function stripcolon(s) {
            return s.replaceAll(':', '');
        }


        wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-' + field.type)
            .merge(wrap);


        var primaryDiv = wrap.selectAll('ul')
            .data([0]);

        primaryDiv = primaryDiv.enter()
            .append('ul')
            .attr('class', 'rows') // not `rows-table` because first item shouldn't have a label
            .merge(primaryDiv);

        items = primaryDiv.selectAll('li')
            .data(field.keys);

        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'labeled-input preset-segregatedcombo-' + stripcolon(d); });

        enter
            .filter(function(_, i) { return i !== 0; }) // skip label for the first/main key (e.g. `surface` itself)
            .append('div')
            .attr('class', 'label preset-label-segregatedcombo')
            .attr('for', function(d) { return 'preset-input-segregatedcombo-' + stripcolon(d); })
            .each(function(d) {
                d3_select(this).call(field.t.append('types.' + d));
            });

        enter
            .append('div')
            .attr('class', 'preset-input-segregatedcombo-wrap form-field-input-wrap')
            .each(function(key) {
                const subField = {
                    ...field,
                    type: 'combo',
                    key
                };
                const combo = uiFieldCombo(subField, context);
                combo.on('change', t => change(key, t[key]));
                _combos[key] = combo;
                d3_select(this).call(combo);
            });

        items = items.merge(enter);

        // Update
        wrap.selectAll('.preset-input-directionalcombo')
            .on('change', change)
            .on('blur', change);
    }


    function change(key, newValue) {
        dispatch.call('change', this, tags => {
            tags[key] = newValue;
            return tags;
        });
    }


    segregatedCombo.tags = function(_ignored) {
        const entityTags = context.selectedIDs()
            .map(id => context.graph().hasEntity(id)?.tags)
            .filter(Boolean);

        for (const key of Object.keys(_combos)) {
            const values = entityTags.map(tags => tags[key]);
            const uniqueValues = [...new Set(values)];
            _combos[key].tags({ [key]: uniqueValues.length > 1 ? uniqueValues : uniqueValues[0] });
        }
    };


    segregatedCombo.focus = function() {
        var node = wrap.selectAll('input').node();
        if (node) node.focus();
    };


    return utilRebind(segregatedCombo, dispatch, 'on');
}

