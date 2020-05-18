import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../core/localizer';
import { JXON } from '../util/jxon';
import { geoExtent } from '../geo';
import { osmChangeset } from '../osm';
import { svgIcon } from '../svg/icon';
import { utilDetect } from '../util/detect';

import {
    utilEntityOrMemberSelector,
    utilKeybinding,
    utilRebind,
    utilWrap
} from '../util';


export function uiConflicts(context) {
    var dispatch = d3_dispatch('cancel', 'save');
    var keybinding = utilKeybinding('conflicts');
    var _origChanges;
    var _conflictList;
    var _shownConflictIndex;


    function keybindingOn() {
        d3_select(document)
            .call(keybinding.on('⎋', cancel, true));
    }

    function keybindingOff() {
        d3_select(document)
            .call(keybinding.unbind);
    }

    function tryAgain() {
        keybindingOff();
        dispatch.call('save');
    }

    function cancel() {
        keybindingOff();
        dispatch.call('cancel');
    }


    function conflicts(selection) {
        keybindingOn();

        var headerEnter = selection.selectAll('.header')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'header fillL');

        headerEnter
            .append('button')
            .attr('class', 'fr')
            .on('click', cancel)
            .call(svgIcon('#iD-icon-close'));

        headerEnter
            .append('h3')
            .text(t('save.conflict.header'));

        var bodyEnter = selection.selectAll('.body')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'body fillL');

        var conflictsHelpEnter = bodyEnter
            .append('div')
            .attr('class', 'conflicts-help')
            .text(t('save.conflict.help'));


        // Download changes link
        var detected = utilDetect();
        var changeset = new osmChangeset();

        delete changeset.id;  // Export without changeset_id

        var data = JXON.stringify(changeset.osmChangeJXON(_origChanges));
        var blob = new Blob([data], { type: 'text/xml;charset=utf-8;' });
        var fileName = 'changes.osc';

        var linkEnter = conflictsHelpEnter.selectAll('.download-changes')
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
            .text(t('save.conflict.download_changes'));


        bodyEnter
            .append('div')
            .attr('class', 'conflict-container fillL3')
            .call(showConflict, 0);

        bodyEnter
            .append('div')
            .attr('class', 'conflicts-done')
            .attr('opacity', 0)
            .style('display', 'none')
            .text(t('save.conflict.done'));

        var buttonsEnter = bodyEnter
            .append('div')
            .attr('class','buttons col12 joined conflicts-buttons');

        buttonsEnter
            .append('button')
            .attr('disabled', _conflictList.length > 1)
            .attr('class', 'action conflicts-button col6')
            .text(t('save.title'))
            .on('click.try_again', tryAgain);

        buttonsEnter
            .append('button')
            .attr('class', 'secondary-action conflicts-button col6')
            .text(t('confirm.cancel'))
            .on('click.cancel', cancel);
    }


    function showConflict(selection, index) {
        index = utilWrap(index, _conflictList.length);
        _shownConflictIndex = index;

        var parent = d3_select(selection.node().parentNode);

        // enable save button if this is the last conflict being reviewed..
        if (index === _conflictList.length - 1) {
            window.setTimeout(function() {
                parent.select('.conflicts-button')
                    .attr('disabled', null);

                parent.select('.conflicts-done')
                    .transition()
                    .attr('opacity', 1)
                    .style('display', 'block');
            }, 250);
        }

        var conflict = selection
            .selectAll('.conflict')
            .data([_conflictList[index]]);

        conflict.exit()
            .remove();

        var conflictEnter = conflict.enter()
            .append('div')
            .attr('class', 'conflict');

        conflictEnter
            .append('h4')
            .attr('class', 'conflict-count')
            .text(t('save.conflict.count', { num: index + 1, total: _conflictList.length }));

        conflictEnter
            .append('a')
            .attr('class', 'conflict-description')
            .attr('href', '#')
            .text(function(d) { return d.name; })
            .on('click', function(d) {
                d3_event.preventDefault();
                zoomToEntity(d.id);
            });

        var details = conflictEnter
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
                    (i === 1 && index === _conflictList.length - 1) || null;
            })
            .on('click', function(d, i) {
                d3_event.preventDefault();

                var container = parent.selectAll('.conflict-container');
                var sign = (i === 0 ? -1 : 1);

                container
                    .selectAll('.conflict')
                    .remove();

                container
                    .call(showConflict, index + sign);
            });

    }


    function addChoices(selection) {
        var choices = selection
            .append('ul')
            .attr('class', 'layer-list')
            .selectAll('li')
            .data(function(d) { return d.choices || []; });

        // enter
        var choicesEnter = choices.enter()
            .append('li')
            .attr('class', 'layer');

        var labelEnter = choicesEnter
            .append('label');

        labelEnter
            .append('input')
            .attr('type', 'radio')
            .attr('name', function(d) { return d.id; })
            .on('change', function(d, i) {
                var ul = this.parentNode.parentNode.parentNode;
                ul.__data__.chosen = i;
                choose(ul, d);
            });

        labelEnter
            .append('span')
            .text(function(d) { return d.text; });

        // update
        choicesEnter
            .merge(choices)
            .each(function(d, i) {
                var ul = this.parentNode;
                if (ul.__data__.chosen === i) {
                    choose(ul, d);
                }
            });
    }


    function choose(ul, datum) {
        if (d3_event) d3_event.preventDefault();

        d3_select(ul)
            .selectAll('li')
            .classed('active', function(d) { return d === datum; })
            .selectAll('input')
            .property('checked', function(d) { return d === datum; });

        var extent = geoExtent();
        var entity;

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
                context.map().zoomToEase(entity);
            }
            context.surface().selectAll(utilEntityOrMemberSelector([entity.id], context.graph()))
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
    conflicts.conflictList = function(_) {
        if (!arguments.length) return _conflictList;
        _conflictList = _;
        return conflicts;
    };


    conflicts.origChanges = function(_) {
        if (!arguments.length) return _origChanges;
        _origChanges = _;
        return conflicts;
    };


    conflicts.shownEntityIds = function() {
        if (_conflictList && typeof _shownConflictIndex === 'number') {
            return [_conflictList[_shownConflictIndex].id];
        }
        return [];
    };


    return utilRebind(conflicts, dispatch, 'on');
}
