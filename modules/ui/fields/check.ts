import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
    select as d3_select
} from 'd3-selection';
import { omit } from 'es-toolkit/compat';

import { utilRebind } from '../../util/rebind';
import { t } from '../../core/localizer';
import { actionReverse } from '../../actions/reverse';
import { svgIcon } from '../../svg/icon';
import { utilCheckTagDictionary } from '../../util';
import { osmOneWayTags } from '../../osm/tags';
import type { EntityId } from '../../osm';

export { uiFieldCheck as uiFieldDefaultCheck };
export { uiFieldCheck as uiFieldOnewayCheck };


export function uiFieldCheck(field: any, context: iD.Context) {
    const dispatch = d3_dispatch('change');
    let options = field.options;
    let values: TagValueUpdate[] = [];
    let texts: ReturnType<typeof t.append>[] = [];

    let _tags: TagsMulti;

    let input    = d3_select<HTMLInputElement, any>(null!);
    let text     = d3_select<HTMLSpanElement, any>(null!);
    let label    = d3_select<HTMLLabelElement, any>(null!);
    let reverser = d3_select<HTMLButtonElement, any>(null!);

    let _impliedYes: boolean;
    let _entityIDs: EntityId[]  = [];
    let _value: TagValueUpdate;


    if (!options && field.options) {
        options = field.options;
    }

    if (options) {
        for (var i in options) {
            var v = options[i];
            values.push(v === 'undefined' ? undefined : v);
            texts.push(field.t.append('options.' + v, { 'default': v }));
        }
    } else {
        values = [undefined, 'yes'];
        texts = [t.append('inspector.unknown'), t.append('inspector.check.yes')];
        if (field.type !== 'defaultCheck') {
            values.push('no');
            texts.push(t.append('inspector.check.no'));
        }
    }


    // Checks tags to see whether an undefined value is "Assumed to be Yes"
    function checkImpliedYes() {
        _impliedYes = (field.id === 'oneway_yes');

        // hack: pretend `oneway` field is a `oneway_yes` field
        // where implied oneway tag exists (e.g. `junction=roundabout`) #2220, #1841
        if (field.id === 'oneway') {
            var entity = context.entity(_entityIDs[0]);
            if (entity.type === 'way' && !!utilCheckTagDictionary(entity.tags, omit(osmOneWayTags, 'oneway'))) {
                _impliedYes = true;
                texts[0] = t.append('_tagging.presets.fields.oneway_yes.options.undefined');
            }
        }
    }


    function reverserHidden() {
        if (!context.container().select('div.inspector-hover').empty()) return true;
        const entity = _entityIDs.length && context.hasEntity(_entityIDs[0]);
        if (!entity || entity.type !== 'way') return true;
        return !(_value === 'yes' || (_impliedYes && !_value));
    }


    function reverserSetText(selection: d3.Selection<HTMLButtonElement>) {
        const entity = _entityIDs.length && context.hasEntity(_entityIDs[0]);
        if (reverserHidden() || !entity) return selection;

        if (entity.type !== 'way') return selection;
        const first = entity.first();
        const last = entity.isClosed() ? entity.nodes[entity.nodes.length - 2] : entity.last();
        const pseudoDirection = first < last;
        const icon = pseudoDirection ? '#iD-icon-forward' : '#iD-icon-backward';

        selection.selectAll<HTMLElement, any>('.reverser-span')
            .text('')
            .call(t.append('inspector.check.reverser'))
            .call(svgIcon(icon, 'inline'));

        return selection;
    }


    const check = function(selection: d3.Selection) {
        checkImpliedYes();

        label = selection.selectAll<HTMLLabelElement, any>('.form-field-input-wrap')
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
            .call(texts[0])
            .attr('class', 'value');

        if (field.type === 'onewayCheck') {
            enter
                .append('button')
                .attr('class', 'reverser' + (reverserHidden() ? ' hide' : ''))
                .append('span')
                .attr('class', 'reverser-span');
        }

        label = label.merge(enter);
        input = label.selectAll<HTMLInputElement, any>('input');
        text = label.selectAll<HTMLSpanElement, any>('span.value');

        input
            .on('click', function(d3_event) {
                d3_event.stopPropagation();
                var t: TagsUpdate = {};

                if (Array.isArray(_tags[field.key])) {
                    if (values.includes('yes')) {
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
            reverser = label.selectAll<HTMLButtonElement, any>('.reverser');

            reverser
                .call(reverserSetText)
                .on('click', function(d3_event) {
                    d3_event.preventDefault();
                    d3_event.stopPropagation();
                    context.perform(
                        function(graph: iD.Graph) {
                            for (var i in _entityIDs) {
                                graph = actionReverse(_entityIDs[i])(graph);
                            }
                            return graph;
                        },
                        t('operations.reverse.annotation.line', { n: '1' })
                    );

                    // must manually revalidate since no 'change' event was called
                    context.validator().validate();

                    d3_select(this)
                        .call(reverserSetText);
                });
        }
    };


    check.entityIDs = function(val?: EntityId[]) {
        if (!arguments.length) return _entityIDs;
        _entityIDs = val!;
        return check;
    };


    check.tags = function(tags: TagsMulti) {

        _tags = tags;

        function isChecked(val: string | undefined) {
            return val !== 'no' && val !== '' && val !== undefined && val !== null;
        }

        function textFor(val: string | undefined) {
            if (val === '') val = undefined;
            var index = values.indexOf(val);
            return (index !== -1 ? texts[index] : ('"' + val + '"'));
        }

        checkImpliedYes();

        const tag = tags[field.key];
        const isMixed = Array.isArray(tag);
        _value = !isMixed && tag ? tag.toLowerCase() : undefined;

        if (field.type === 'onewayCheck' && (_value === '1' || _value === '-1')) {
            _value = 'yes';
        }

        input
            .property('indeterminate', isMixed || (field.type !== 'defaultCheck' && !_value))
            .property('checked', isChecked(_value));

        const textForValue = textFor(_value);
        text.text('');
        text.call(isMixed
                ? t.append('inspector.multiple_values')
                : typeof textForValue === 'string'
                    ? (selection: d3.Selection) => selection.text(textForValue)
                    : textForValue)
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
        input.node()?.focus();
    };

    return utilRebind(check, dispatch, 'on');
}
