import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';
import { JXON } from '../util/jxon';
import { geoExtent } from '../geo';
import { osmChangeset } from '../osm';
import { svgIcon } from '../svg';
import { utilDetect } from '../util/detect';
import { utilEntityOrMemberSelector } from '../util';
import { utilRebind } from '../util/rebind';


export function uiConflicts(context) {
    var dispatch = d3_dispatch('cancel', 'save'),
        origChanges,
        conflictList;


    function conflicts(selection) {
        var header = selection
            .append('div')
            .attr('class', 'header fillL');

        header
            .append('button')
            .attr('class', 'fr')
            .on('click', function() { dispatch.call('cancel'); })
            .call(svgIcon('#icon-close'));

        header
            .append('h3')
            .text(t('save.conflict.header'));

        var body = selection
            .append('div')
            .attr('class', 'body fillL');

        var conflictsHelp = body
            .append('div')
            .attr('class', 'conflicts-help')
            .text(t('save.conflict.help'));


        // Download changes link
        var detected = utilDetect(),
            changeset = new osmChangeset();

        delete changeset.id;  // Export without chnageset_id

        var data = JXON.stringify(changeset.osmChangeJXON(origChanges)),
            blob = new Blob([data], {type: 'text/xml;charset=utf-8;'}),
            fileName = 'changes.osc';

        var linkEnter = conflictsHelp.selectAll('.download-changes')
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
            .text(t('save.conflict.download_changes'));


        body
            .append('div')
            .attr('class', 'conflict-container fillL3')
            .call(showConflict, 0);

        body
            .append('div')
            .attr('class', 'conflicts-done')
            .attr('opacity', 0)
            .style('display', 'none')
            .text(t('save.conflict.done'));

        var buttons = body
            .append('div')
            .attr('class','buttons col12 joined conflicts-buttons');

        buttons
            .append('button')
            .attr('disabled', conflictList.length > 1)
            .attr('class', 'action conflicts-button col6')
            .text(t('save.title'))
            .on('click.try_again', function() { dispatch.call('save'); });

        buttons
            .append('button')
            .attr('class', 'secondary-action conflicts-button col6')
            .text(t('confirm.cancel'))
            .on('click.cancel', function() { dispatch.call('cancel'); });
    }


    function showConflict(selection, index) {
        if (index < 0 || index >= conflictList.length) return;

        var parent = d3_select(selection.node().parentNode);

        // enable save button if this is the last conflict being reviewed..
        if (index === conflictList.length - 1) {
            window.setTimeout(function() {
                parent.select('.conflicts-button')
                    .attr('disabled', null);

                parent.select('.conflicts-done')
                    .transition()
                    .attr('opacity', 1)
                    .style('display', 'block');
            }, 250);
        }

        var item = selection
            .selectAll('.conflict')
            .data([conflictList[index]]);

        var enter = item.enter()
            .append('div')
            .attr('class', 'conflict');

        enter
            .append('h4')
            .attr('class', 'conflict-count')
            .text(t('save.conflict.count', { num: index + 1, total: conflictList.length }));

        enter
            .append('a')
            .attr('class', 'conflict-description')
            .attr('href', '#')
            .text(function(d) { return d.name; })
            .on('click', function(d) {
                zoomToEntity(d.id);
                d3_event.preventDefault();
            });

        var details = enter
            .append('div')
            .attr('class', 'conflict-detail-container');

        details
            .append('ul')
            .attr('class', 'conflict-detail-list')
            .selectAll('li')
            .data(function(d) { return d.details || []; })
            .enter()
            .append('li')
            .attr('class', 'conflict-detail-item')
            .html(function(d) { return d; });

        details
            .append('div')
            .attr('class', 'conflict-choices')
            .call(addChoices);

        details
            .append('div')
            .attr('class', 'conflict-nav-buttons joined cf')
            .selectAll('button')
            .data(['previous', 'next'])
            .enter()
            .append('button')
            .text(function(d) { return t('save.conflict.' + d); })
            .attr('class', 'conflict-nav-button action col6')
            .attr('disabled', function(d, i) {
                return (i === 0 && index === 0) ||
                    (i === 1 && index === conflictList.length - 1) || null;
            })
            .on('click', function(d, i) {
                var container = parent.select('.conflict-container'),
                sign = (i === 0 ? -1 : 1);

                container
                    .selectAll('.conflict')
                    .remove();

                container
                    .call(showConflict, index + sign);

                d3_event.preventDefault();
            });

        item.exit()
            .remove();
    }


    function addChoices(selection) {
        var choices = selection
            .append('ul')
            .attr('class', 'layer-list')
            .selectAll('li')
            .data(function(d) { return d.choices || []; });

        var enter = choices.enter()
            .append('li')
            .attr('class', 'layer');

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', 'radio')
            .attr('name', function(d) { return d.id; })
            .on('change', function(d, i) {
                var ul = this.parentNode.parentNode.parentNode;
                ul.__data__.chosen = i;
                choose(ul, d);
            });

        label
            .append('span')
            .text(function(d) { return d.text; });

        choices
            .each(function(d, i) {
                var ul = this.parentNode;
                if (ul.__data__.chosen === i) choose(ul, d);
            });
    }


    function choose(ul, datum) {
        if (d3_event) d3_event.preventDefault();

        d3_select(ul)
            .selectAll('li')
            .classed('active', function(d) { return d === datum; })
            .selectAll('input')
            .property('checked', function(d) { return d === datum; });

        var extent = geoExtent(),
            entity;

        entity = context.graph().hasEntity(datum.id);
        if (entity) extent._extend(entity.extent(context.graph()));

        datum.action();

        entity = context.graph().hasEntity(datum.id);
        if (entity) extent._extend(entity.extent(context.graph()));

        zoomToEntity(datum.id, extent);
    }


    function zoomToEntity(id, extent) {
        context.surface().selectAll('.hover')
            .classed('hover', false);

        var entity = context.graph().hasEntity(id);
        if (entity) {
            if (extent) {
                context.map().trimmedExtent(extent);
            } else {
                context.map().zoomTo(entity);
            }
            context.surface().selectAll(
                utilEntityOrMemberSelector([entity.id], context.graph()))
                .classed('hover', true);
        }
    }


    // The conflict list should be an array of objects like:
    // {
    //     id: id,
    //     name: entityName(local),
    //     details: merge.conflicts(),
    //     chosen: 1,
    //     choices: [
    //         choice(id, keepMine, forceLocal),
    //         choice(id, keepTheirs, forceRemote)
    //     ]
    // }
    conflicts.list = function(_) {
        if (!arguments.length) return conflictList;
        conflictList = _;
        return conflicts;
    };


    conflicts.origChanges = function(_) {
        if (!arguments.length) return origChanges;
        origChanges = _;
        return conflicts;
    };


    return utilRebind(conflicts, dispatch, 'on');
}
