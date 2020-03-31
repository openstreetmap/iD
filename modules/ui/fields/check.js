import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select,
    event as d3_event
} from 'd3-selection';

import { utilRebind } from '../../util/rebind';
import { t } from '../../core/localizer';
import { actionReverse } from '../../actions/reverse';
import { osmOneWayTags } from '../../osm';
import { svgIcon } from '../../svg/icon';

export { uiFieldCheck as uiFieldDefaultCheck };
export { uiFieldCheck as uiFieldOnewayCheck };


export function uiFieldCheck(field, context) {
    var dispatch = d3_dispatch('change');
    var options = field.strings && field.strings.options;
    var values = [];
    var texts = [];

    var _tags;

    var input = d3_select(null);
    var text = d3_select(null);
    var label = d3_select(null);
    var reverser = d3_select(null);

    var _impliedYes;
    var _entityIDs = [];
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
            var entity = context.entity(_entityIDs[0]);
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
        if (!context.container().select('div.inspector-hover').empty()) return true;
        return !(_value === 'yes' || (_impliedYes && !_value));
    }


    function reverserSetText(selection) {
        var entity = _entityIDs.length && context.hasEntity(_entityIDs[0]);
        if (reverserHidden() || !entity) return selection;

        var first = entity.first();
        var last = entity.isClosed() ? entity.nodes[entity.nodes.length - 2] : entity.last();
        var pseudoDirection = first < last;
        var icon = pseudoDirection ? '#iD-icon-forward' : '#iD-icon-backward';

        selection.selectAll('.reverser-span')
            .text(t('inspector.check.reverser'))
            .call(svgIcon(icon, 'inline'));

        return selection;
    }


    var check = function(selection) {
        checkImpliedYes();

        label = selection.selectAll('.form-field-input-wrap')
            .data([0]);

        var enter = label.enter()
            .append('label')
            .attr('class', 'form-field-input-wrap form-field-input-check');

        enter
            .append('input')
            .property('indeterminate', field.type !== 'defaultCheck')
            .attr('type', 'checkbox')
            .attr('id', field.domId);

        enter
            .append('span')
            .text(texts[0])
            .attr('class', 'value');

        if (field.type === 'onewayCheck') {
            enter
                .append('a')
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
                d3_event.stopPropagation();
                var t = {};

                if (Array.isArray(_tags[field.key])) {
                    if (values.indexOf('yes') !== -1) {
                        t[field.key] = 'yes';
                    } else {
                        t[field.key] = values[0];
                    }
                } else {
                    t[field.key] = values[(values.indexOf(_value) + 1) % values.length];
                }

                // Don't cycle through `alternating` or `reversible` states - #4970
                // (They are supported as translated strings, but should not toggle with clicks)
                if (t[field.key] === 'reversible' || t[field.key] === 'alternating') {
                    t[field.key] = values[0];
                }

                dispatch.call('change', this, t);
            });

        if (field.type === 'onewayCheck') {
            reverser = label.selectAll('.reverser');

            reverser
                .call(reverserSetText)
                .on('click', function() {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                    context.perform(
                        function(graph) {
                            for (var i in _entityIDs) {
                                graph = actionReverse(_entityIDs[i])(graph);
                            }
                            return graph;
                        },
                        t('operations.reverse.annotation')
                    );

                    // must manually revalidate since no 'change' event was called
                    context.validator().validate();

                    d3_select(this)
                        .call(reverserSetText);
                });
        }
    };


    check.entityIDs = function(val) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val;
        return check;
    };


    check.tags = function(tags) {

        _tags = tags;

        function isChecked(val) {
            return val !== 'no' && val !== '' && val !== undefined && val !== null;
        }

        function textFor(val) {
            if (val === '') val = undefined;
            var index = values.indexOf(val);
            return (index !== -1 ? texts[index] : ('"' + val + '"'));
        }

        checkImpliedYes();

        var isMixed = Array.isArray(tags[field.key]);

        _value = !isMixed && tags[field.key] && tags[field.key].toLowerCase();

        if (field.type === 'onewayCheck' && (_value === '1' || _value === '-1')) {
            _value = 'yes';
        }

        input
            .property('indeterminate', isMixed || (field.type !== 'defaultCheck' && !_value))
            .property('checked', isChecked(_value));

        text
            .text(isMixed ? t('inspector.multiple_values') : textFor(_value))
            .classed('mixed', isMixed);

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
