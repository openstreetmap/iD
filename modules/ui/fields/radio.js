import * as d3 from 'd3';
import { t } from '../../util/locale';
import { d3combobox } from '../../lib/d3.combobox.js';
import { services } from '../../services/index';

import {
    utilGetSetValue,
    utilNoAuto,
    utilRebind
} from '../../util';


export { uiFieldRadio as uiFieldStructureRadio };


export function uiFieldRadio(field) {
    var dispatch = d3.dispatch('change'),
        taginfo = services.taginfo,
        placeholder = d3.select(null),
        wrap = d3.select(null),
        labels = d3.select(null),
        radios = d3.select(null),
        typeInput = d3.select(null),
        layerInput = d3.select(null);


    function selectedKey() {
        var selector = '.form-field-structure .toggle-list label.active input',
            node = d3.selectAll(selector);
        return node && node.datum();
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
            .data(field.options || field.keys);

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
        function checked(d) {
            return !!(tags[d] && tags[d] !== 'no');
        }

        var extrasWrap = selection.selectAll('.structure-extras-wrap')
            .data([0]);

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
        var typeItem = list.selectAll('.structure-type-item')
            .data([0]);

        var typeEnter = typeItem.enter()
            .append('li')
            .attr('class', 'cf structure-type-item');

        typeEnter
            .append('span')
            .attr('class', 'col6 label structure-label-type')
            .attr('for', 'structure-input-type')
            .text('Type');

        typeEnter
            .append('div')
            .attr('class', 'col6 structure-input-type-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', 'structure-input-type')
            .attr('placeholder', t('inspector.unknown'))
            .call(utilNoAuto);

        typeItem = typeItem
            .merge(typeEnter);

        typeInput = typeItem.selectAll('.structure-input-type');

        if (taginfo) {
            typeInput
                .call(d3combobox().fetcher(typeFetcher));
        }

        typeInput
            .on('change', changeType)
            .on('blur', changeType);



        // Layer
        var showLayer = checked('bridge') || checked('tunnel');
        var layerItem = list.selectAll('.structure-layer-item')
            .data(showLayer ? [0] : []);

        layerItem.exit()
            .remove();

        var layerEnter = layerItem.enter()
            .append('li')
            .attr('class', 'cf structure-layer-item');

        layerEnter
            .append('span')
            .attr('class', 'col6 label structure-label-layer')
            .attr('for', 'structure-input-layer')
            .text('Layer');

        layerEnter
            .append('div')
            .attr('class', 'col6 structure-input-layer-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', 'structure-input-layer')
            .attr('placeholder', '0')
            .call(utilNoAuto);

        var spin = layerEnter
            .append('div')
            .attr('class', 'spin-control');

        spin
            .append('button')
            .datum(1)
            .attr('class', 'increment')
            .attr('tabindex', -1);

        spin
            .append('button')
            .datum(-1)
            .attr('class', 'decrement')
            .attr('tabindex', -1);

        layerItem = layerItem
            .merge(layerEnter);

        layerInput = layerItem.selectAll('.structure-input-layer')
            .on('change', changeLayer)
            .on('blur', changeLayer);

        layerItem.selectAll('button')
            .on('click', function(d) {
                d3.event.preventDefault();
                var num = parseInt(layerInput.node().value || 0, 10);
                if (!isNaN(num)) layerInput.node().value = num + d;
                changeLayer();
            });

    }


    function typeFetcher(q, callback) {
        taginfo.values({
            debounce: (q !== ''),
            key: selectedKey(),
            query: q
        }, function(err, data) {
            if (err) return;
            var comboData = data.map(function(d) {
                // var k = d.value;
                // var v = snake_case ? unsnake(k) : k;
                // return {
                //     key: k,
                //     value: v,
                //     title: d.title
                // };
                return {
                    key: d.value,
                    value: d.value,
                    title: d.title
                };
            });
            if (callback) callback(comboData);
        });
    }


    function changeType() {
        var key = selectedKey(),
            t = {};

        if (!key) return;
        t[key] = utilGetSetValue(typeInput);
        dispatch.call('change', this, t);
    }


    function changeLayer() {
        // note: don't use utilGetSetValue here because we want 0 to be falsy.
        var t = { layer: layerInput.node().value || undefined };
        dispatch.call('change', this, t);
    }


    function changeRadio() {
        function checked(d) {
            return !!(t[d] && t[d] !== 'no');
        }

        var t = {};
        if (field.key) {
            t[field.key] = undefined;
        }

        radios.each(function(d) {
            var active = d3.select(this).property('checked');
            if (field.key) {
                if (active) t[field.key] = d;
            } else {
                var val = utilGetSetValue(typeInput) || 'yes';
                t[d] = active ? val : undefined;
            }
        });

        if (field.type === 'structureRadio') {
            if (checked('bridge')) {
                t.layer = '1';
            } else if (checked('tunnel')) {
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
                return !!(tags[d] && tags[d] !== 'no');
            }
        }

        labels.classed('active', checked);
        radios.property('checked', checked);
        var selection = radios.filter(function() { return this.checked; });
        var typeVal = '';

        if (selection.empty()) {
            placeholder.text(t('inspector.none'));
        } else {
            placeholder.text(selection.attr('value'));
            typeVal = tags[selection.datum()];
        }

        if (field.type === 'structureRadio') {
            wrap.call(structureExtras, tags);
            utilGetSetValue(typeInput, typeVal || '');
            utilGetSetValue(layerInput, tags.layer || '');
        }
    };


    radio.focus = function() {
        radios.node().focus();
    };


    return utilRebind(radio, dispatch, 'on');
}
