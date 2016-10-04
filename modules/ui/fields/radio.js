import * as d3 from 'd3';
import { t } from '../../util/locale';
import { utilRebind } from '../../util/rebind';


export function uiFieldRadio(field) {
    var dispatch = d3.dispatch('change'),
        placeholder = d3.select(null),
        labels = d3.select(null),
        radios = d3.select(null);


    function radio(selection) {
        selection.classed('preset-radio', true);

        var wrap = selection.selectAll('.preset-input-wrap')
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

        enter.append('input')
            .attr('type', 'radio')
            .attr('name', field.id)
            .attr('value', function(d) { return field.t('options.' + d, { 'default': d }); })
            .attr('checked', false);

        enter.append('span')
            .text(function(d) { return field.t('options.' + d, { 'default': d }); });

        labels = labels
            .merge(enter);

        radios = labels.selectAll('input')
            .on('change', change);
    }


    function change() {
        var t = {};
        if (field.key) t[field.key] = undefined;
        radios.each(function(d) {
            var active = d3.select(this).property('checked');
            if (field.key) {
                if (active) t[field.key] = d;
            } else {
                t[d] = active ? 'yes' : undefined;
            }
        });
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
        if (selection.empty()) {
            placeholder.text(t('inspector.none'));
        } else {
            placeholder.text(selection.attr('value'));
        }
    };


    radio.focus = function() {
        radios.node().focus();
    };


    return utilRebind(radio, dispatch, 'on');
}
