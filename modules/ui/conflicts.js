import { rebind } from '../util/rebind';
import * as d3 from 'd3';
import { t } from '../util/locale';
import { Extent } from '../geo/index';
import { Icon } from '../svg/index';
import { entityOrMemberSelector } from '../util/index';

export function Conflicts(context) {
    var dispatch = d3.dispatch('download', 'cancel', 'save'),
        list;

    function conflicts(selection) {
        var header = selection
            .append('div')
            .attr('class', 'header fillL');

        header
            .append('button')
            .attr('class', 'fr')
            .on('click', function() { dispatch.call("cancel"); })
            .call(Icon('#icon-close'));

        header
            .append('h3')
            .text(t('save.conflict.header'));

        var body = selection
            .append('div')
            .attr('class', 'body fillL');

        body
            .append('div')
            .attr('class', 'conflicts-help')
            .text(t('save.conflict.help'))
            .append('a')
            .attr('class', 'conflicts-download')
            .text(t('save.conflict.download_changes'))
            .on('click.download', function() { dispatch.call("download"); });

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
            .attr('disabled', list.length > 1)
            .attr('class', 'action conflicts-button col6')
            .text(t('save.title'))
            .on('click.try_again', function() { dispatch.call("save"); });

        buttons
            .append('button')
            .attr('class', 'secondary-action conflicts-button col6')
            .text(t('confirm.cancel'))
            .on('click.cancel', function() { dispatch.call("cancel"); });
    }


    function showConflict(selection, index) {
        if (index < 0 || index >= list.length) return;

        var parent = d3.select(selection.node().parentNode);

        // enable save button if this is the last conflict being reviewed..
        if (index === list.length - 1) {
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
            .data([list[index]]);

        var enter = item.enter()
            .append('div')
            .attr('class', 'conflict');

        enter
            .append('h4')
            .attr('class', 'conflict-count')
            .text(t('save.conflict.count', { num: index + 1, total: list.length }));

        enter
            .append('a')
            .attr('class', 'conflict-description')
            .attr('href', '#')
            .text(function(d) { return d.name; })
            .on('click', function(d) {
                zoomToEntity(d.id);
                d3.event.preventDefault();
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
                    (i === 1 && index === list.length - 1) || null;
            })
            .on('click', function(d, i) {
                var container = parent.select('.conflict-container'),
                sign = (i === 0 ? -1 : 1);

                container
                    .selectAll('.conflict')
                    .remove();

                container
                    .call(showConflict, index + sign);

                d3.event.preventDefault();
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
        if (d3.event) d3.event.preventDefault();

        d3.select(ul)
            .selectAll('li')
            .classed('active', function(d) { return d === datum; })
            .selectAll('input')
            .property('checked', function(d) { return d === datum; });

        var extent = Extent(),
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
                entityOrMemberSelector([entity.id], context.graph()))
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
        if (!arguments.length) return list;
        list = _;
        return conflicts;
    };

    return rebind(conflicts, dispatch, 'on');
}
