import { dispatch as d3_dispatch } from 'd3-dispatch';

import {
    select as d3_select
} from 'd3-selection';

import { t } from '../core/localizer';
import { JXON } from '../util/jxon';
import { geoExtent } from '../geo';
import { osmChangeset } from '../osm';
import { svgIcon } from '../svg/icon';

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
            .attr('title', t('icons.close'))
            .on('click', cancel)
            .call(svgIcon('#iD-icon-close'));

        headerEnter
            .append('h2')
            .call(t.append('save.conflict.header'));

        var bodyEnter = selection.selectAll('.body')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'body fillL');

        var conflictsHelpEnter = bodyEnter
            .append('div')
            .attr('class', 'conflicts-help')
            .call(t.append('save.conflict.help'));


        // Download changes link
        var changeset = new osmChangeset();

        delete changeset.id;  // Export without changeset_id

        var data = JXON.stringify(changeset.osmChangeJXON(_origChanges));
        var blob = new Blob([data], { type: 'text/xml;charset=utf-8;' });
        var fileName = 'changes.osc';

        var linkEnter = conflictsHelpEnter.selectAll('.download-changes')
            .append('a')
            .attr('class', 'download-changes');

        // download the data as a file
        linkEnter
            .attr('href', window.URL.createObjectURL(blob))
            .attr('download', fileName);

        linkEnter
            .call(svgIcon('#iD-icon-load', 'inline'))
            .append('span')
            .call(t.append('save.conflict.download_changes'));


        bodyEnter
            .append('div')
            .attr('class', 'conflict-container fillL3')
            .call(showConflict, 0);

        bodyEnter
            .append('div')
            .attr('class', 'conflicts-done')
            .attr('opacity', 0)
            .style('display', 'none')
            .call(t.append('save.conflict.done'));

        var buttonsEnter = bodyEnter
            .append('div')
            .attr('class','buttons col12 joined conflicts-buttons');

        buttonsEnter
            .append('button')
            .attr('disabled', _conflictList.length > 1)
            .attr('class', 'action conflicts-button col6')
            .call(t.append('save.title'))
            .on('click.try_again', tryAgain);

        buttonsEnter
            .append('button')
            .attr('class', 'secondary-action conflicts-button col6')
            .call(t.append('confirm.cancel'))
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
            .call(t.append('save.conflict.count', { num: index + 1, total: _conflictList.length }));

        conflictEnter
            .append('a')
            .attr('class', 'conflict-description')
            .attr('href', '#')
            .text(function(d) { return d.name; })
            .on('click', function(d3_event, d) {
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
            .attr('class', 'conflict-nav-button action col6')
            .attr('disabled', function(d, i) {
                return (i === 0 && index === 0) ||
                    (i === 1 && index === _conflictList.length - 1) || null;
            })
            .on('click', function(d3_event, d) {
                d3_event.preventDefault();

                var container = parent.selectAll('.conflict-container');
                var sign = (d === 'previous' ? -1 : 1);

                container
                    .selectAll('.conflict')
                    .remove();

                container
                    .call(showConflict, index + sign);
            })
            .call(function(d) { t.append('save.conflict.' + d)(d3_select(this)); });

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
            .on('change', function(d3_event, d) {
                var ul = this.parentNode.parentNode.parentNode;
                ul.__data__.chosen = d.id;
                choose(d3_event, ul, d);
            });

        labelEnter
            .append('span')
            .text(function(d) { return d.text; });

        // update
        choicesEnter
            .merge(choices)
            .each(function(d) {
                var ul = this.parentNode;
                if (ul.__data__.chosen === d.id) {
                    choose(null, ul, d);
                }
            });
    }


    function choose(d3_event, ul, datum) {
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
