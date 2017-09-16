import * as d3 from 'd3';
import { t } from '../util/locale';
import { JXON } from '../util/jxon';
import { actionDiscardTags } from '../actions';
import { osmChangeset } from '../osm';
import { svgIcon } from '../svg';
import { utilDetect } from '../util/detect';

import {
    utilDisplayName,
    utilDisplayType,
    utilEntityOrMemberSelector
} from '../util';


export function uiCommitChanges(context) {
    var detected = utilDetect();


    function commitChanges(selection) {

        var history = context.history(),
            summary = history.difference().summary();

        var container = selection.selectAll('.modal-section.commit-section')
            .data([0]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'commit-section modal-section fillL2');

        containerEnter
            .append('h3')
            .text(t('commit.changes', { count: summary.length }));

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
                d3.select(this)
                    .call(svgIcon('#icon-' + d.entity.geometry(d.graph), 'pre-text ' + d.changeType));
            });

        itemsEnter
            .append('span')
            .attr('class', 'change-type')
            .text(function(d) { return t('commit.' + d.changeType) + ' '; });

        itemsEnter
            .append('strong')
            .attr('class', 'entity-type')
            .text(function(d) {
                var matched = context.presets().match(d.entity, d.graph);
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
            .on('click', zoomToEntity);


        // Download changeset link
        var changeset = new osmChangeset().update({ id: undefined }),
            changes = history.changes(actionDiscardTags(history.difference()));

        delete changeset.id;  // Export without chnageset_id

        var data = JXON.stringify(changeset.osmChangeJXON(changes)),
            uri = 'data:text/xml;charset=utf-8,' + encodeURIComponent(data);

        var linkEnter = container.selectAll('.download-changes')
            .data([0])
            .enter()
            .append('a')
            .attr('class', 'download-changes');

        if (detected.download) {      // all except IE11 and Edge
            linkEnter                 // download the data uri as a file
                .attr('href', uri)
                .attr('download', 'changes.osc')
                .call(svgIcon('#icon-load', 'inline'))
                .append('span')
                .text(t('commit.download_changes'));

        } else {                      // IE11 and Edge
            linkEnter                 // open data uri in a new tab
                .attr('target', '_blank')
                .call(svgIcon('#icon-load', 'inline'))
                .append('span')
                .text(t('commit.download_changes'));

            linkEnter
                .on('click.download', function() {
                    var win = window.open(uri, '_blank');
                    win.focus();
                });
        }


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


        function zoomToEntity(change) {
            var entity = change.entity;
            if (change.changeType !== 'deleted' &&
                context.graph().entity(entity.id).geometry(context.graph()) !== 'vertex') {
                context.map().zoomTo(entity);
                context.surface().selectAll(utilEntityOrMemberSelector([entity.id], context.graph()))
                    .classed('hover', true);
            }
        }
    }


    return commitChanges;
}
