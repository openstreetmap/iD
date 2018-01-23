import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select,
    event as d3_event
} from 'd3-selection';

import { utilRebind } from '../../util/rebind';
import { t } from '../../util/locale';
import { actionReverse } from '../../actions';
import { osmOneWayTags } from '../../osm';
import { svgIcon } from '../../svg';

export { uiFieldCheck as uiFieldDefaultCheck };
export { uiFieldCheck as uiFieldOnewayCheck };


export function uiFieldCheck(field, context) {
    var dispatch = d3_dispatch('change');
    var options = field.strings && field.strings.options;
    var values = [];
    var texts = [];

    var input = d3_select(null);
    var text = d3_select(null);
    var label = d3_select(null);
    var reverser = d3_select(null);

    var _impliedYes;
    var _entityID;
    var _value;


    if (options) {
        for (var k in options) {
            values.push(k === 'undefined' ? undefined : k);
            texts.push(field.t('options.' + k, { 'default': options[k] }));
        }
    } else {
        values = [undefined, 'yes'];
        texts = [t('inspector.unknown'), t('inspector.check.yes')];
        if (field.type !== 'defaultCheck') {
            values.push('no');
            texts.push(t('inspector.check.no'));
        }
    }


    // Checks tags to see whether an undefined value is "Assumed to be Yes"
    function checkImpliedYes() {
        _impliedYes = (field.id === 'oneway_yes');

        // hack: pretend `oneway` field is a `oneway_yes` field
        // where implied oneway tag exists (e.g. `junction=roundabout`) #2220, #1841
        if (field.id === 'oneway') {
            var entity = context.entity(_entityID);
            for (var key in entity.tags) {
                if (key in osmOneWayTags && (entity.tags[key] in osmOneWayTags[key])) {
                    _impliedYes = true;
                    texts[0] = t('presets.fields.oneway_yes.options.undefined');
                    break;
                }
            }
        }
    }


    function reverserHidden() {
        if (!d3_select('div.inspector-hover').empty()) return true;
        return !(_value === 'yes' || (_impliedYes && !_value));
    }


    function reverserSetText(selection) {
        var entity = context.hasEntity(_entityID);
        if (reverserHidden() || !entity) return selection;

        var first = entity.first();
        var last = entity.isClosed() ? entity.nodes[entity.nodes.length - 2] : entity.last();
        var pseudoDirection = first < last;
        var icon = pseudoDirection ? '#icon-forward' : '#icon-backward';

        selection.selectAll('.reverser-span')
            .text(t('inspector.check.reverser'))
            .call(svgIcon(icon, 'inline'));

        return selection;
    }


    var check = function(selection) {
        checkImpliedYes();
        selection.classed('checkselect', 'true');

        label = selection.selectAll('.preset-input-wrap')
            .data([0]);

        var enter = label.enter()
            .append('label')
            .attr('class', 'preset-input-wrap');

        enter
            .append('input')
            .property('indeterminate', field.type !== 'defaultCheck')
            .attr('type', 'checkbox')
            .attr('id', 'preset-input-' + field.id);

        enter
            .append('span')
            .text(texts[0])
            .attr('class', 'value');

        if (field.type === 'onewayCheck') {
            enter
                .append('a')
                .attr('id', 'preset-input-' + field.id + '-reverser')
                .attr('class', 'reverser button' + (reverserHidden() ? ' hide' : ''))
                .attr('href', '#')
                .append('span')
                .attr('class', 'reverser-span');
        }

        label = label.merge(enter);
        input = label.selectAll('input');
        text = label.selectAll('span.value');

        input
            .on('click', function() {
                var t = {};
                t[field.key] = values[(values.indexOf(_value) + 1) % values.length];
                dispatch.call('change', this, t);
                d3_event.stopPropagation();
            });

        if (field.type === 'onewayCheck') {
            reverser = label.selectAll('.reverser');

            reverser
                .call(reverserSetText)
                .on('click', function() {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                    context.perform(
                        actionReverse(_entityID),
                        t('operations.reverse.annotation')
                    );
                    d3_select(this)
                        .call(reverserSetText);
                });
        }
    };


    check.entity = function(_) {
        if (!arguments.length) return context.hasEntity(_entityID);
        _entityID = _.id;
        return check;
    };


    check.tags = function(tags) {

        function isChecked(val) {
            return val !== 'no' && val !== '' && val !== undefined && val !== null;
        }

        function textFor(val) {
            if (val === '') val = undefined;
            var index = values.indexOf(val);
            return (index !== -1 ? texts[index] : ('"' + val + '"'));
        }

        checkImpliedYes();
        _value = tags[field.key] && tags[field.key].toLowerCase();

        if (field.type === 'onewayCheck' && (_value === '1' || _value === '-1')) {
            _value = 'yes';
        }

        input
            .property('indeterminate', field.type !== 'defaultCheck' && !_value)
            .property('checked', isChecked(_value));

        text
            .text(textFor(_value));

        label
            .classed('set', !!_value);

        if (field.type === 'onewayCheck') {
            reverser
                .classed('hide', reverserHidden())
                .call(reverserSetText);
        }
    };


    check.focus = function() {
        input.node().focus();
    };

    return utilRebind(check, dispatch, 'on');
}
