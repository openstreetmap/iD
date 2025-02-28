import { dispatch as d3_dispatch } from 'd3-dispatch';
import { select as d3_select } from 'd3-selection';

import { presetManager } from '../../presets';
import { t } from '../../core/localizer';
import { uiField } from '../field';
import { utilArrayUnion, utilRebind } from '../../util';


export { uiFieldRadio as uiFieldStructureRadio };


export function uiFieldRadio(field, context) {
    const dispatch = d3_dispatch('change');
    let placeholder = d3_select(null);
    let wrap = d3_select(null);
    let labels = d3_select(null);
    let radios = d3_select(null);
    const radioData = (field.options || field.keys).slice();  // shallow copy
    let typeField;
    let layerField;
    let _oldType = {};
    let _entityIDs = [];


    function selectedKey() {
        const node = wrap.selectAll('.form-field-input-radio label.active input');
        return !node.empty() && node.datum();
    }


    function radio(selection) {
        selection.classed('preset-radio', true);

        wrap = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        let enter = wrap.enter()
            .append('div')
            .attr('class', 'form-field-input-wrap form-field-input-radio');

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

        const stringsField = field.resolveReference('stringsCrossReference');
        enter
            .append('input')
            .attr('type', 'radio')
            .attr('name', field.id)
            .attr('value', function(d) { return stringsField.t('options.' + d, { 'default': d }); })
            .attr('checked', false);

        enter
            .append('span')
            .each(function(d) { stringsField.t.append('options.' + d, { 'default': d })(d3_select(this)); });

        labels = labels
            .merge(enter);

        radios = labels.selectAll('input')
            .on('change', changeRadio);

    }


    function structureExtras(selection, tags) {
        const selected = selectedKey() || tags.layer !== undefined;
        const type = presetManager.field(selected);
        const layer = presetManager.field('layer');
        const showLayer = (selected === 'bridge' || selected === 'tunnel' || tags.layer !== undefined);


        let extrasWrap = selection.selectAll('.structure-extras-wrap')
            .data(selected ? [0] : []);

        extrasWrap.exit()
            .remove();

        extrasWrap = extrasWrap.enter()
            .append('div')
            .attr('class', 'structure-extras-wrap')
            .merge(extrasWrap);

        let list = extrasWrap.selectAll('ul')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'rows')
            .merge(list);


        // Type
        if (type) {
            if (!typeField || typeField.id !== selected) {
                typeField = uiField(context, type, _entityIDs, { wrap: false })
                    .on('change', changeType);
            }
            typeField.tags(tags);
        } else {
            typeField = null;
        }

        let typeItem = list.selectAll('.structure-type-item')
            .data(typeField ? [typeField] : [], function(d) { return d.id; });

        // Exit
        typeItem.exit()
            .remove();

        // Enter
        const typeEnter = typeItem.enter()
            .insert('li', ':first-child')
            .attr('class', 'labeled-input structure-type-item');

        typeEnter
            .append('div')
            .attr('class', 'label structure-label-type')
            .attr('for', 'preset-input-' + selected)
            .call(t.append('inspector.radio.structure.type'));

        typeEnter
            .append('div')
            .attr('class', 'structure-input-type-wrap');

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
                layerField = uiField(context, layer, _entityIDs, { wrap: false })
                    .on('change', changeLayer);
            }
            layerField.tags(tags);
            field.keys = utilArrayUnion(field.keys, ['layer']);
        } else {
            layerField = null;
            field.keys = field.keys.filter(function(k) { return k !== 'layer'; });
        }

        let layerItem = list.selectAll('.structure-layer-item')
            .data(layerField ? [layerField] : []);

        // Exit
        layerItem.exit()
            .remove();

        // Enter
        const layerEnter = layerItem.enter()
            .append('li')
            .attr('class', 'labeled-input structure-layer-item');

        layerEnter
            .append('div')
            .attr('class', 'label structure-label-layer')
            .attr('for', 'preset-input-layer')
            .call(t.append('inspector.radio.structure.layer'));

        layerEnter
            .append('div')
            .attr('class', 'structure-input-layer-wrap');

        // Update
        layerItem = layerItem
            .merge(layerEnter);

        if (layerField) {
            layerItem.selectAll('.structure-input-layer-wrap')
                .call(layerField.render);
        }
    }


    function changeType(t, onInput) {
        const key = selectedKey();
        if (!key) return;

        const val = t[key];
        if (val !== 'no') {
            _oldType[key] = val;
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
        const t = {};
        let activeKey;

        if (field.key) {
            t[field.key] = undefined;
        }

        radios.each(function(d) {
            const active = d3_select(this).property('checked');
            if (active) activeKey = d;

            if (field.key) {
                if (active) t[field.key] = d;
            } else {
                const val = _oldType[activeKey] || 'yes';
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
        function isOptionChecked(d) {
            if (field.key) {
                return tags[field.key] === d;
            }
            return !!(typeof tags[d] === 'string' && tags[d].toLowerCase() !== 'no');
        }

        function isMixed(d) {
            if (field.key) {
                return Array.isArray(tags[field.key]) && tags[field.key].includes(d);
            }
            return Array.isArray(tags[d]);
        }

        radios.property('checked', function(d) {
            return isOptionChecked(d) &&
                (field.key || field.options.filter(isOptionChecked).length === 1);
        });

        labels
            .classed('active', function(d) {
                if (field.key) {
                    return (Array.isArray(tags[field.key]) && tags[field.key].includes(d))
                        || tags[field.key] === d;
                }
                return Array.isArray(tags[d]) && tags[d].some(v => typeof v === 'string' && v.toLowerCase() !== 'no') ||
                    !!(typeof tags[d] === 'string' && tags[d].toLowerCase() !== 'no');
            })
            .classed('mixed', isMixed)
            .attr('title', function(d) {
                return isMixed(d) ? t('inspector.unshared_value_tooltip') : null;
            });


        const selection = radios.filter(function() { return this.checked; });

        if (selection.empty()) {
            placeholder.text('');
            placeholder.call(t.append('inspector.none'));
        } else {
            placeholder.text(selection.attr('value'));
            _oldType[selection.datum()] = tags[selection.datum()];
        }

        if (field.type === 'structureRadio') {
            if (!!tags.waterway && !_oldType.tunnel) {
                // default waterway tunnels to 'culvert'
                _oldType.tunnel = 'culvert';
            }
            if (!!tags.waterway && !_oldType.bridge) {
                // default waterway bridges to 'aqueduct'
                _oldType.bridge = 'aqueduct';
            }

            wrap.call(structureExtras, tags);
        }
    };


    radio.focus = function() {
        radios.node().focus();
    };


    radio.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        _oldType = {};
        return radio;
    };


    radio.isAllowed = function() {
        return _entityIDs.length === 1;
    };


    return utilRebind(radio, dispatch, 'on');
}
