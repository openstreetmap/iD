import * as d3 from 'd3';
import { utilRebind } from '../../util/rebind';
import { t } from '../../util/locale';
import { actionReverse } from '../../actions';
import { osmOneWayTags } from '../../osm';
import { svgIcon } from '../../svg';

export { uiFieldCheck as uiFieldDefaultCheck };
export { uiFieldCheck as uiFieldOnewayCheck };


export function uiFieldCheck(field, context) {
    var dispatch = d3.dispatch('change'),
        options = field.strings && field.strings.options,
        values = [],
        texts = [],
        input = d3.select(null),
        text = d3.select(null),
        label = d3.select(null),
        reverser = d3.select(null),
        impliedYes,
        entityId,
        value;


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
        impliedYes = (field.id === 'oneway_yes');

        // hack: pretend `oneway` field is a `oneway_yes` field
        // where implied oneway tag exists (e.g. `junction=roundabout`) #2220, #1841
        if (field.id === 'oneway') {
            var entity = context.entity(entityId);
            for (var key in entity.tags) {
                if (key in osmOneWayTags && (entity.tags[key] in osmOneWayTags[key])) {
                    impliedYes = true;
                    texts[0] = t('presets.fields.oneway_yes.options.undefined');
                    break;
                }
            }
        }
    }


    function reverserHidden() {
        if (!d3.select('div.inspector-hover').empty()) return true;
        return !(value === 'yes' || (impliedYes && !value));
    }


    function reverserSetText(selection) {
        var entity = context.hasEntity(entityId);
        if (reverserHidden() || !entity) return selection;

        var first = entity.first(),
            last = entity.isClosed() ? entity.nodes[entity.nodes.length - 2] : entity.last(),
            pseudoDirection = first < last,
            icon = pseudoDirection ? '#icon-forward' : '#icon-backward';

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
                t[field.key] = values[(values.indexOf(value) + 1) % values.length];
                dispatch.call('change', this, t);
                d3.event.stopPropagation();
            });

        if (field.type === 'onewayCheck') {
            reverser = label.selectAll('.reverser');

            reverser
                .call(reverserSetText)
                .on('click', function() {
                    d3.event.preventDefault();
                    d3.event.stopPropagation();
                    context.perform(
                        actionReverse(entityId),
                        t('operations.reverse.annotation')
                    );
                    d3.select(this)
                        .call(reverserSetText);
                });
        }
    };


    check.entity = function(_) {
        if (!arguments.length) return context.hasEntity(entityId);
        entityId = _.id;
        return check;
    };


    check.tags = function(tags) {
        checkImpliedYes();
        value = tags[field.key] && tags[field.key].toLowerCase();

        if (field.type === 'onewayCheck' && (value === '1' || value === '-1')) {
            value = 'yes';
        }

        input
            .property('indeterminate', field.type !== 'defaultCheck' && !value)
            .property('checked', value === 'yes');

        text
            .text(texts[values.indexOf(value)]);

        label
            .classed('set', !!value);

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
