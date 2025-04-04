import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { utilRebind } from '../../util';
import { uiFieldCombo } from './combo';


export function uiFieldDirectionalCombo(field, context) {
    var dispatch = d3_dispatch('change');
    var items = d3_select(null);
    var wrap = d3_select(null);
    var _tags;

    /** @type {Record<string, ReturnType<typeof uiFieldCombo>>} */
    const _combos = {};

    // fallback for schema-builder v5's cycleway field type: can be removed eventually
    if (field.type === 'cycleway') {
        field = {
            ...field,
            key: field.keys[0],
            keys: field.keys.slice(1)
        };
    }

    function directionalCombo(selection) {

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
            .attr('class', 'rows rows-table')
            .merge(div);

        items = div.selectAll('li')
            .data(field.keys);

        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'labeled-input preset-directionalcombo-' + stripcolon(d); });

        enter
            .append('div')
            .attr('class', 'label preset-label-directionalcombo')
            .attr('for', function(d) { return 'preset-input-directionalcombo-' + stripcolon(d); })
            .html(function(d) { return field.t.html('types.' + d); });

        enter
            .append('div')
            .attr('class', 'preset-input-directionalcombo-wrap form-field-input-wrap')
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
        const commonKey = field.key;
        /** if commonKey ends with :both, this is the key without :both. and vice-verca */
        const otherCommonKey = field.key.endsWith(':both')
            ? field.key.replace(/:both$/, '')
            : `${field.key}:both`;

        const otherKey = key === field.keys[0] ? field.keys[1] : field.keys[0];

        dispatch.call('change', this, tags => {
            let otherValue = tags[otherKey] || tags[commonKey] || tags[otherCommonKey];
            if (otherValue === 'left') { otherValue = otherKey.endsWith(':right') ? 'no' : 'yes'; }
            if (otherValue === 'right') { otherValue = otherKey.endsWith(':left') ? 'no' : 'yes'; }
            if (otherValue === 'both') { otherValue = 'yes'; }

            if (newValue === otherValue) {
                // both tags match, use the common tag to tag both sides the same way
                tags[commonKey] = newValue;
                delete tags[key];
                delete tags[otherKey];
                delete tags[otherCommonKey];
            } else {
                // Always set both left and right as changing one can affect the other
                tags[key] = newValue;
                delete tags[commonKey];
                delete tags[otherCommonKey];
                tags[otherKey] = otherValue;
            }
            return tags;
        });
    }


    directionalCombo.tags = function(tags) {
        _tags = tags;

        /**
         * @param {Array<any>} input - The input array.
         */
        const uniqueValues = (input) => [...new Set(input)].filter(Boolean);

        const commonKey = field.key.replace(/:both$/, '');
        const bothValue = [
            tags[field.key] === 'both' ? 'yes' : undefined, // transform sidewalk=both
            _tags[commonKey],
            _tags[`${commonKey}:both`
        ]];
        const leftValue = uniqueValues([
            // transform sidewalk=both once the UI was used to change one side to a specific value; we end up with sidewalk:left=separate+sidewalk:right=both|left because the original value is copied to the key:SIDE.
            _tags[`${commonKey}:left`] === 'both' ? 'yes' : undefined,
            _tags[`${commonKey}:left`] === 'left' ? 'yes' : undefined,
            _tags[`${commonKey}:left`],
            tags[field.key] === 'left' ? 'yes' : undefined,
            tags[field.key] === 'right' ? 'no' : undefined,
            ...bothValue
        ]);
        const rightValue = uniqueValues([
            _tags[`${commonKey}:right`] === 'both' ? 'yes' : undefined,
            _tags[`${commonKey}:right`] === 'right' ? 'yes' : undefined,
            _tags[`${commonKey}:right`],
            tags[field.key] === 'left' ? 'no' : undefined,
            tags[field.key] === 'right' ? 'yes' : undefined,
            ...bothValue
        ]);

        for (const key in _combos) {
            if (key.endsWith(':left')) {
                _combos[key].tags({ [key]: leftValue.at(0) });
            }
            if (key.endsWith(':right')) {
                _combos[key].tags({ [key]: rightValue.at(0) });
            }
        }
    };


    directionalCombo.focus = function() {
        var node = wrap.selectAll('input').node();
        if (node) node.focus();
    };


    return utilRebind(directionalCombo, dispatch, 'on');
}
