import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { utilGetSetValue, utilNoAuto, utilRebind } from '../../util';
import { t } from '../../core/localizer';
import { uiFieldCombo } from './combo';


export function uiFieldDirectionalCombo(field, context) {
    var dispatch = d3_dispatch('change');
    var items = d3_select(null);
    var wrap = d3_select(null);
    var _tags;

    var _combos = {};

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
            .attr('class', 'rows')
            .merge(div);

        var keys = field.keys.slice(1);

        items = div.selectAll('li')
            .data(keys);

        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'labeled-input preset-directionalcombo-' + stripcolon(d); });

        enter
            .append('span')
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
        const commonKey = field.keys[0];

        // don't override multiple values with blank string
        if (!newValue && (Array.isArray(_tags[commonKey]) || Array.isArray(_tags[key]))) return;

        if (newValue === 'none' || newValue === '') { newValue = undefined; }

        const otherKey = key === field.keys[1] ? field.keys[2] : field.keys[1];
        let otherValue = typeof _tags[commonKey] === 'string' ? _tags[commonKey] : _tags[otherKey];
        if (otherValue && Array.isArray(otherValue)) {
            // we must always have an explicit value for comparison
            otherValue = otherValue[0];
        }
        if (otherValue === 'none' || otherValue === '') { otherValue = undefined; }

        var tag = {};

        // If the left and right tags match, use the common tag to tag both sides the same way
        if (newValue === otherValue) {
            tag[commonKey] = newValue;
            tag[key] = undefined;
            tag[otherKey] = undefined;
        } else {
            // Always set both left and right as changing one can affect the other
            tag[commonKey] = undefined;
            tag[key] = newValue;
            tag[otherKey] = otherValue;
        }

        dispatch.call('change', this, tag);
    }


    directionalCombo.tags = function(tags) {
        _tags = tags;

        const commonKey = field.keys[0];
        for (let key in _combos) {
            const uniqueValues = [... new Set([]
                .concat(tags[commonKey])
                .concat(tags[key])
                .filter(Boolean))];
            _combos[key].tags({ [key]: uniqueValues.length > 1 ? uniqueValues : uniqueValues[0] });
        }
    };


    directionalCombo.focus = function() {
        var node = wrap.selectAll('input').node();
        if (node) node.focus();
    };


    return utilRebind(directionalCombo, dispatch, 'on');
}
