import _map from 'lodash-es/map';

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

        var issues = context.issueManager().validate();

        validations = _reduce(issues, function(validations, val) {
            var severity = val.severity;
            if (validations.hasOwnProperty(severity)) {
                validations[severity].push(val);
            } else {
                validations[severity] = [val];
            }
            return validations;
        }, {});

        _forEach(validations, function(instances, severity) {
            instances = _uniqBy(instances, function(val) { return val.id + '_' + val.message.replace(/\s+/g,''); });
            var section = severity + '-section';
            var instanceItem = severity + '-item';

            var container = selection.selectAll('.' + section)
                .data(instances.length ? [0] : []);

            container.exit()
                .remove();

            var containerEnter = container.enter()
                .append('div')
                .attr('class', 'modal-section ' + section + ' fillL2');

            containerEnter
                .append('h3')
                .text(severity === 'warning' ? t('commit.warnings') : t('commit.errors'));

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
                if (d.entities) {
                    context.surface().selectAll(
                        utilEntityOrMemberSelector(
                            _map(d.entities, function(e) { return e.id; }),
                            context.graph()
                        )
                    ).classed('hover', true);
                }
            }

            function mouseout() {
                context.surface().selectAll('.hover')
                    .classed('hover', false);
            }

            function warningClick(d) {
                if (d.entities) {
                    context.map().zoomTo(d.entities[0]);
                    context.enter(modeSelect(
                        context,
                        _map(d.entities, function(e) { return e.id; }),
                    ));
                }
            }
        });
    }


    return commitWarnings;
}
