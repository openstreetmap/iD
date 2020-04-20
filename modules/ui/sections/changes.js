import { select as d3_select } from 'd3-selection';

import { presetManager } from '../../presets';
import { fileFetcher } from '../../core/file_fetcher';
import { t } from '../../core/localizer';
import { JXON } from '../../util/jxon';
import { actionDiscardTags } from '../../actions/discard_tags';
import { osmChangeset } from '../../osm';
import { svgIcon } from '../../svg/icon';
import { utilDetect } from '../../util/detect';
import { uiSection } from '../section';

import {
    utilDisplayName,
    utilDisplayType,
    utilEntityOrMemberSelector
} from '../../util';


export function uiSectionChanges(context) {
    var detected = utilDetect();

    var _discardTags = {};
    fileFetcher.get('discarded')
        .then(function(d) { _discardTags = d; })
        .catch(function() { /* ignore */ });

    var section = uiSection('changes-list', context)
        .title(function() {
            var history = context.history();
            var summary = history.difference().summary();
            return t('commit.changes', { count: summary.length });
        })
        .disclosureContent(renderDisclosureContent);

    function renderDisclosureContent(selection) {
        var history = context.history();
        var summary = history.difference().summary();

        var container = selection.selectAll('.commit-section')
            .data([0]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'commit-section');

        containerEnter
            .append('ul')
            .attr('class', 'changeset-list');

        container = containerEnter
            .merge(container);


        var items = container.select('ul').selectAll('li')
            .data(summary);

        var itemsEnter = items.enter()
            .append('li')
            .attr('class', 'change-item');

        itemsEnter
            .each(function(d) {
                d3_select(this)
                    .call(svgIcon('#iD-icon-' + d.entity.geometry(d.graph), 'pre-text ' + d.changeType));
            });

        itemsEnter
            .append('span')
            .attr('class', 'change-type')
            .text(function(d) { return t('commit.' + d.changeType) + ' '; });

        itemsEnter
            .append('strong')
            .attr('class', 'entity-type')
            .text(function(d) {
                var matched = presetManager.match(d.entity, d.graph);
                return (matched && matched.name()) || utilDisplayType(d.entity.id);
            });

        itemsEnter
            .append('span')
            .attr('class', 'entity-name')
            .text(function(d) {
                var name = utilDisplayName(d.entity) || '',
                    string = '';
                if (name !== '') {
                    string += ':';
                }
                return string += ' ' + name;
            });

        itemsEnter
            .style('opacity', 0)
            .transition()
            .style('opacity', 1);

        items = itemsEnter
            .merge(items);

        items
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', click);


        // Download changeset link
        var changeset = new osmChangeset().update({ id: undefined });
        var changes = history.changes(actionDiscardTags(history.difference(), _discardTags));

        delete changeset.id;  // Export without chnageset_id

        var data = JXON.stringify(changeset.osmChangeJXON(changes));
        var blob = new Blob([data], {type: 'text/xml;charset=utf-8;'});
        var fileName = 'changes.osc';

        var linkEnter = container.selectAll('.download-changes')
            .data([0])
            .enter()
            .append('a')
            .attr('class', 'download-changes');

        if (detected.download) {      // All except IE11 and Edge
            linkEnter                 // download the data as a file
                .attr('href', window.URL.createObjectURL(blob))
                .attr('download', fileName);

        } else {                      // IE11 and Edge
            linkEnter                 // open data uri in a new tab
                .attr('target', '_blank')
                .on('click.download', function() {
                    navigator.msSaveBlob(blob, fileName);
                });
        }

        linkEnter
            .call(svgIcon('#iD-icon-load', 'inline'))
            .append('span')
            .text(t('commit.download_changes'));


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


        function click(change) {
            if (change.changeType !== 'deleted') {
                var entity = change.entity;
                context.map().zoomToEase(entity);
                context.surface().selectAll(utilEntityOrMemberSelector([entity.id], context.graph()))
                    .classed('hover', true);
            }
        }
    }

    return section;
}
