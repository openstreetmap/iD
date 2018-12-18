import { t } from '../util/locale';
import { modeSelect } from '../modes';
import { svgIcon } from '../svg';
import { tooltip } from '../util/tooltip';
import { utilEntityOrMemberSelector } from '../util';
import _reduce from 'lodash-es/reduce';
import _forEach from 'lodash-es/forEach';
import _uniqBy from 'lodash-es/uniqBy';

export function uiCommitWarnings(context) {

    function commitWarnings(selection) {

        var changes = context.history().changes();
        var validations = context.history().validate(changes);

        validations = _reduce(validations, function(validations, val) {
            var severity = val.severity;
            if (validations.hasOwnProperty(severity)) {
                validations[severity].push(val);
            } else {
                validations[severity] = [val];
            }
            return validations;
        }, {});

        _forEach(validations, function(instances, type) {
            instances = _uniqBy(instances, function(val) { return val.id + '_' + val.message.replace(/\s+/g,''); });
            var section = type + '-section';
            var instanceItem = type + '-item';

            var container = selection.selectAll('.' + section)
                .data(instances.length ? [0] : []);

            container.exit()
                .remove();

            var containerEnter = container.enter()
                .append('div')
                .attr('class', 'modal-section ' + section + ' fillL2');

            containerEnter
                .append('h3')
                .text(type === 'warning' ? t('commit.warnings') : t('commit.errors'));

            containerEnter
                .append('ul')
                .attr('class', 'changeset-list');

            container = containerEnter
                .merge(container);


            var items = container.select('ul').selectAll('li')
                .data(instances);

            items.exit()
                .remove();

            var itemsEnter = items.enter()
                .append('li')
                .attr('class', instanceItem);

            itemsEnter
                .call(svgIcon('#iD-icon-alert', 'pre-text'));

            itemsEnter
                .append('strong')
                .text(function(d) { return d.message; });

            itemsEnter.filter(function(d) { return d.tooltip; })
                .call(tooltip()
                    .title(function(d) { return d.tooltip; })
                    .placement('top')
                );

            items = itemsEnter
                .merge(items);

            items
                .on('mouseover', mouseover)
                .on('mouseout', mouseout)
                .on('click', warningClick);


            function mouseover(d) {
                if (d.entity) {
                    context.surface().selectAll(
                        utilEntityOrMemberSelector([d.entity.id], context.graph())
                    ).classed('hover', true);
                }
            }


            function mouseout() {
                context.surface().selectAll('.hover')
                    .classed('hover', false);
            }


            function warningClick(d) {
                if (d.entity) {
                    context.map().zoomTo(d.entity);
                    context.enter(modeSelect(context, [d.entity.id]));
                }
            }
        });
    }


    return commitWarnings;
}
