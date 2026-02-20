import { select as d3_select } from 'd3-selection';

import { presetManager } from '../../presets';
import { fileFetcher } from '../../core/file_fetcher';
import { coreChangesetSplitter } from '../../core/changeset_splitter';
import { t } from '../../core/localizer';
import { JXON } from '../../util/jxon';
import { actionDiscardTags } from '../../actions/discard_tags';
import { osmChangeset } from '../../osm';
import { svgIcon } from '../../svg/icon';
import { uiSection } from '../section';

import {
    utilDisplayName,
    utilDisplayType,
    utilEntityOrMemberSelector
} from '../../util';


export function uiSectionChanges(context) {
    var _discardTags = {};
    fileFetcher.get('discarded')
        .then(function(d) { _discardTags = d; })
        .catch(function() { /* ignore */ });

    var section = uiSection('changes-list', context)
        .label(function() {
            var history = context.history();
            var summary = history.difference().summary();
            return t.append('inspector.title_count', { title: t('commit.changes'), count: summary.length });
        })
        .disclosureContent(renderDisclosureContent);

    function renderDisclosureContent(selection) {
        var history = context.history();
        var summary = history.difference().summary();
        var changes = history.changes(actionDiscardTags(history.difference(), _discardTags));
        var groups = coreChangesetSplitter(changes, context.graph());
        var groupedSummary = splitSummaryIntoGroups(summary, groups);

        var container = selection.selectAll('.commit-section')
            .data([0]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'commit-section');

        containerEnter
            .append('p')
            .attr('class', 'changeset-multi-message field-warning hide');

        containerEnter
            .append('div')
            .attr('class', 'changeset-groups');

        containerEnter
            .append('a')
            .attr('class', 'download-changes');

        container = containerEnter
            .merge(container);

        var splitMessage = container.select('.changeset-multi-message');
        splitMessage
            .classed('hide', groups.length <= 1)
            .text(groups.length > 1 ? getSplitMessage(groups.length) : '');

        var groupContainers = container.select('.changeset-groups')
            .selectAll('.changeset-group')
            .data(groupedSummary);

        var groupEnter = groupContainers.enter()
            .append('div')
            .attr('class', 'changeset-group');

        groupEnter
            .append('h4')
            .attr('class', 'changeset-group-title');

        groupEnter
            .append('ul')
            .attr('class', 'changeset-list');

        groupContainers.exit()
            .remove();

        groupContainers = groupEnter
            .merge(groupContainers);

        groupContainers.select('.changeset-group-title')
            .classed('hide', groups.length <= 1)
            .text(function(d, i) {
                var groupLabel = t('commit.changeset_group', {
                    num: i + 1,
                    default: ''
                });
                if (!groupLabel) {
                    groupLabel = 'Changeset ' + (i + 1);
                }
                return t('inspector.title_count', {
                    title: groupLabel,
                    count: d.length
                });
            });

        var items = groupContainers.select('ul').selectAll('li')
            .data(function(d) { return d; }, function(d) { return d.changeType + '-' + d.entity.id; });

        var itemsEnter = items.enter()
            .append('li')
            .attr('class', 'change-item');

        var buttons = itemsEnter
            .append('button')
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', click);

        buttons
            .each(function(d) {
                d3_select(this)
                    .call(svgIcon('#iD-icon-' + d.entity.geometry(d.graph), 'pre-text ' + d.changeType));
            });

        buttons
            .append('span')
            .attr('class', 'change-type')
            .html(function(d) { return t.html('commit.' + d.changeType) + ' '; });

        buttons
            .append('strong')
            .attr('class', 'entity-type')
            .text(function(d) {
                var matched = presetManager.match(d.entity, d.graph);
                return (matched && matched.name()) || utilDisplayType(d.entity.id);
            });

        buttons
            .append('span')
            .attr('class', 'entity-name')
            .text(function(d) {
                var name = utilDisplayName(d.entity) || '';
                return (name !== '' ? ':' : '') + ' ' + name;
            });

        items.exit()
            .remove();


        // Download changeset link
        var changeset = new osmChangeset().update({ id: undefined });

        var data = JXON.stringify(changeset.osmChangeJXON(changes));
        var blob = new Blob([data], {type: 'text/xml;charset=utf-8;'});
        var fileName = 'changes.osc';

        var link = container.selectAll('.download-changes')
            .data([0]);

        var linkEnter = link.enter()
            .append('a')
            .attr('class', 'download-changes');

        link = linkEnter
            .merge(link)
            .attr('href', window.URL.createObjectURL(blob))
            .attr('download', fileName);

        linkEnter
            .call(svgIcon('#iD-icon-load', 'inline'))
            .append('span')
            .call(t.append('commit.download_changes'));


        function mouseover(d3_event, d) {
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


        function click(d3_event, change) {
            if (change.changeType !== 'deleted') {
                var entity = change.entity;
                context.map().zoomToEase(entity);
                context.surface().selectAll(utilEntityOrMemberSelector([entity.id], context.graph()))
                    .classed('hover', true);
            }
        }
    }

    function getSplitMessage(groupCount) {
        var message = t('commit.multiple_changesets_info', {
            count: groupCount,
            default: ''
        });
        if (!message) {
            message = 'Some edits are too far apart and will be uploaded separately as ' + groupCount + ' changesets. Review each group below.';
        }
        return message;
    }

    function splitSummaryIntoGroups(summary, groups) {
        var indexByEntityID = {};
        for (var i = 0; i < groups.length; i++) {
            var entities = groups[i].created.concat(groups[i].modified).concat(groups[i].deleted);
            for (var j = 0; j < entities.length; j++) {
                indexByEntityID[entities[j].id] = i;
            }
        }

        var grouped = groups.map(function() { return []; });
        for (var k = 0; k < summary.length; k++) {
            var change = summary[k];
            var index = indexByEntityID[change.entity.id];
            if (index === undefined) index = 0;
            if (!grouped[index]) grouped[index] = [];
            grouped[index].push(change);
        }

        return grouped.filter(function(group) { return group.length; });
    }

    return section;
}
