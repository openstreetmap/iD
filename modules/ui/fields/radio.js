import _clone from 'lodash-es/clone';
import _pull from 'lodash-es/pull';
import _union from 'lodash-es/union';

import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { t } from '../../util/locale';
import { uiField } from '../field';
import { utilRebind } from '../../util';


export { uiFieldRadio as uiFieldStructureRadio };


export function uiFieldRadio(field, context) {
    var dispatch = d3_dispatch('change'),
        placeholder = d3_select(null),
        wrap = d3_select(null),
        labels = d3_select(null),
        radios = d3_select(null),
        radioData = _clone(field.options || field.keys),
        typeField,
        layerField,
        oldType = {},
        entity;


    function selectedKey() {
        var node = wrap.selectAll('.toggle-list label.active input');
        return !node.empty() && node.datum();
    }


    function radio(selection) {
        selection.classed('preset-radio', true);

        wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        var enter = wrap.enter()
            .append('div')
            .attr('class', 'preset-input-wrap toggle-list');

        enter
            .append('span')
            .attr('class', 'placeholder');

        wrap = wrap
            .merge(enter);


        placeholder = wrap.selectAll('.placeholder');

        labels = wrap.selectAll('label')
            .data(radioData);

        enter = labels.enter()
            .append('label');

        enter
            .append('input')
            .attr('type', 'radio')
            .attr('name', field.id)
            .attr('value', function(d) { return field.t('options.' + d, { 'default': d }); })
            .attr('checked', false);

        enter
            .append('span')
            .text(function(d) { return field.t('options.' + d, { 'default': d }); });

        labels = labels
            .merge(enter);

        radios = labels.selectAll('input')
            .on('change', changeRadio);

    }


    function structureExtras(selection, tags) {
        var selected = selectedKey(),
            type = context.presets().field(selected),
            layer = context.presets().field('layer'),
            showLayer = (selected === 'bridge' || selected === 'tunnel');


        var extrasWrap = selection.selectAll('.structure-extras-wrap')
            .data(selected ? [0] : []);

        extrasWrap.exit()
            .remove();

        extrasWrap = extrasWrap.enter()
            .append('div')
            .attr('class', 'structure-extras-wrap')
            .merge(extrasWrap);

        var list = extrasWrap.selectAll('ul')
            .data([0]);

        list = list.enter()
            .append('ul')
            .merge(list);


        // Type
        if (type) {
            if (!typeField || typeField.id !== selected) {
                typeField = uiField(context, type, entity, { wrap: false })
                    .on('change', changeType);
            }
            typeField.tags(tags);
        } else {
            typeField = null;
        }

        var typeItem = list.selectAll('.structure-type-item')
            .data(typeField ? [typeField] : [], function(d) { return d.id; });

        // Exit
        typeItem.exit()
            .remove();

        // Enter
        var typeEnter = typeItem.enter()
            .insert('li', ':first-child')
            .attr('class', 'cf structure-type-item');

        typeEnter
            .append('span')
            .attr('class', 'col6 label structure-label-type')
            .attr('for', 'preset-input-' + selected)
            .text(t('inspector.radio.structure.type'));

        typeEnter
            .append('div')
            .attr('class', 'col6 structure-input-type-wrap');

        // Update
        typeItem = typeItem
            .merge(typeEnter);

        if (typeField) {
            typeItem.selectAll('.structure-input-type-wrap')
                .call(typeField.render);
        }


        // Layer
        if (layer && showLayer) {
            if (!layerField) {
                layerField = uiField(context, layer, entity, { wrap: false })
                    .on('change', changeLayer);
            }
            layerField.tags(tags);
            field.keys = _union(field.keys, ['layer']);
        } else {
            layerField = null;
            _pull(field.keys, 'layer');
        }

        var layerItem = list.selectAll('.structure-layer-item')
            .data(layerField ? [layerField] : []);

        // Exit
        layerItem.exit()
            .remove();

        // Enter
        var layerEnter = layerItem.enter()
            .append('li')
            .attr('class', 'cf structure-layer-item');

        layerEnter
            .append('span')
            .attr('class', 'col6 label structure-label-layer')
            .attr('for', 'preset-input-layer')
            .text(t('inspector.radio.structure.layer'));

        layerEnter
            .append('div')
            .attr('class', 'col6 structure-input-layer-wrap');

        // Update
        layerItem = layerItem
            .merge(layerEnter);

        if (layerField) {
            layerItem.selectAll('.structure-input-layer-wrap')
                .call(layerField.render);
        }
    }


    function changeType(t, onInput) {
        var key = selectedKey();
        if (!key) return;

        var val = t[key];
        if (val !== 'no') {
            oldType[key] = val;
        }

        if (field.type === 'structureRadio') {
            // remove layer if it should not be set
            if (val === 'no' ||
                (key !== 'bridge' && key !== 'tunnel') ||
                (key === 'tunnel' && val === 'building_passage')) {
                t.layer = undefined;
            }
            // add layer if it should be set
            if (t.layer === undefined) {
                if (key === 'bridge' && val !== 'no') {
                    t.layer = '1';
                }
                if (key === 'tunnel' && val !== 'no' && val !== 'building_passage') {
                    t.layer = '-1';
                }
            }
         }

        dispatch.call('change', this, t, onInput);
    }


    function changeLayer(t, onInput) {
        if (t.layer === '0') {
            t.layer = undefined;
        }
        dispatch.call('change', this, t, onInput);
    }


    function changeRadio() {
        var t = {},
            activeKey;

        if (field.key) {
            t[field.key] = undefined;
        }

        radios.each(function(d) {
            var active = d3_select(this).property('checked');
            if (active) activeKey = d;

            if (field.key) {
                if (active) t[field.key] = d;
            } else {
                var val = oldType[activeKey] || 'yes';
                t[d] = active ? val : undefined;
            }
        });

        if (field.type === 'structureRadio') {
            if (activeKey === 'bridge') {
                t.layer = '1';
            } else if (activeKey === 'tunnel' && t.tunnel !== 'building_passage') {
                t.layer = '-1';
            } else {
                t.layer = undefined;
            }
        }

        dispatch.call('change', this, t);
    }


    radio.tags = function(tags) {
        function checked(d) {
            if (field.key) {
                return tags[field.key] === d;
            } else {
                return !!(tags[d] && tags[d].toLowerCase() !== 'no');
            }
        }

        labels.classed('active', checked);
        radios.property('checked', checked);

        var selection = radios.filter(function() { return this.checked; });

        if (selection.empty()) {
            placeholder.text(t('inspector.none'));
        } else {
            placeholder.text(selection.attr('value'));
            oldType[selection.datum()] = tags[selection.datum()];
        }

        if (field.type === 'structureRadio') {
            // For waterways without a tunnel tag, set 'culvert' as
            // the oldType to default to if the user picks 'tunnel'
            if (!!tags.waterway && !oldType.tunnel) {
                oldType.tunnel = 'culvert';
            }

            wrap.call(structureExtras, tags);
        }
    };


    radio.focus = function() {
        radios.node().focus();
    };


    radio.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        oldType = {};
        return radio;
    };


    return utilRebind(radio, dispatch, 'on');
}
