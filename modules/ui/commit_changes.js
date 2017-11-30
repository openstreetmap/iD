import { select as d3_select } from 'd3-selection';

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
    var _entityID;
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
                d3_select(this)
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
            .on('click', click);


        // Download changeset link
        var changeset = new osmChangeset().update({ id: undefined }),
            changes = history.changes(actionDiscardTags(history.difference()));

        delete changeset.id;  // Export without chnageset_id

        var data = JXON.stringify(changeset.osmChangeJXON(changes)),
            blob = new Blob([data], {type: 'text/xml;charset=utf-8;'}),
            fileName = 'changes.osc';

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
            .call(svgIcon('#icon-load', 'inline'))
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
            if (change.changeType === 'deleted') {
                _entityID = null;
            } else {
                var entity = change.entity;
                _entityID = change.entity.id;
                context.map().zoomTo(entity);
                context.surface().selectAll(utilEntityOrMemberSelector([_entityID], context.graph()))
                    .classed('hover', true);
            }
        }
    }


    commitChanges.entityID = function(_) {
        if (!arguments.length) return _entityID;
        _entityID = _;
        return commitChanges;
    };



    return commitChanges;
}
