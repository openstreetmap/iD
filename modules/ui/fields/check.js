import * as d3 from 'd3';
import { utilRebind } from '../../util/rebind';
import { t } from '../../util/locale';
import { osmOneWayTags } from '../../osm/index';

export { uiFieldCheck as uiFieldDefaultcheck };


export function uiFieldCheck(field) {
    var dispatch = d3.dispatch('change'),
        options = field.strings && field.strings.options,
        values = [],
        texts = [],
        input = d3.select(null),
        text = d3.select(null),
        label = d3.select(null),
        entity, value;

    if (options) {
        for (var k in options) {
            values.push(k === 'undefined' ? undefined : k);
            texts.push(field.t('options.' + k, { 'default': options[k] }));
        }
    } else {
        values = [undefined, 'yes'];
        texts = [t('inspector.unknown'), t('inspector.check.yes')];
        if (field.type === 'check') {
            values.push('no');
            texts.push(t('inspector.check.no'));
        }
    }


    var check = function(selection) {
        // hack: pretend oneway field is a oneway_yes field
        // where implied oneway tag exists (e.g. `junction=roundabout`) #2220, #1841
        if (field.id === 'oneway') {
            for (var key in entity.tags) {
                if (key in osmOneWayTags && (entity.tags[key] in osmOneWayTags[key])) {
                    texts[0] = t('presets.fields.oneway_yes.options.undefined');
                    break;
                }
            }
        }

        selection.classed('checkselect', 'true');

        label = selection.selectAll('.preset-input-wrap')
            .data([0]);

        var enter = label.enter()
            .append('label')
            .attr('class', 'preset-input-wrap');

        enter
            .append('input')
            .property('indeterminate', field.type === 'check')
            .attr('type', 'checkbox')
            .attr('id', 'preset-input-' + field.id);

        enter
            .append('span')
            .text(texts[0])
            .attr('class', 'value');

        label = label.merge(enter);
        input = label.selectAll('input');
        text = label.selectAll('span.value');

        input
            .on('click', function() {
                var t = {};
                t[field.key] = values[(values.indexOf(value) + 1) % values.length];
                dispatch.call('change', this, t);
                d3.event.stopPropagation();
            });
    };


    check.entity = function(_) {
        if (!arguments.length) return entity;
        entity = _;
        return check;
    };


    check.tags = function(tags) {
        value = tags[field.key];
        input.property('indeterminate', field.type === 'check' && !value);
        input.property('checked', value === 'yes');
        text.text(texts[values.indexOf(value)]);
        label.classed('set', !!value);
    };


    check.focus = function() {
        input.node().focus();
    };

    return utilRebind(check, dispatch, 'on');
}
