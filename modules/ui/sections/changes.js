import { select as d3_select } from 'd3-selection';

import { presetManager } from '../../presets';
import { fileFetcher } from '../../core/file_fetcher';
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
    let _discardTags = {};
    fileFetcher.get('discarded')
        .then(function(d) { _discardTags = d; })
        .catch(function() { /* ignore */ });

    const section = uiSection('changes-list', context)
        .label(function() {
            const history = context.history();
            const summary = history.difference().summary();
            return t.append('inspector.title_count', { title: t('commit.changes'), count: summary.length });
        })
        .disclosureContent(renderDisclosureContent);

    function renderDisclosureContent(selection) {
        const history = context.history();
        const summary = history.difference().summary();

        let container = selection.selectAll('.commit-section')
            .data([0]);

        const containerEnter = container.enter()
            .append('div')
            .attr('class', 'commit-section');

        containerEnter
            .append('ul')
            .attr('class', 'changeset-list');

        container = containerEnter
            .merge(container);


        let items = container.select('ul').selectAll('li')
            .data(summary);

        const itemsEnter = items.enter()
            .append('li')
            .attr('class', 'change-item');

        const buttons = itemsEnter
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
                const matched = presetManager.match(d.entity, d.graph);
                return (matched && matched.name()) || utilDisplayType(d.entity.id);
            });

        buttons
            .append('span')
            .attr('class', 'entity-name')
            .text(function(d) {
                const name = utilDisplayName(d.entity) || '';
                let string = '';
                if (name !== '') {
                    string += ':';
                }
                return string += ' ' + name;
            });

        items = itemsEnter
            .merge(items);


        // Download changeset link
        const changeset = new osmChangeset().update({ id: undefined });
        const changes = history.changes(actionDiscardTags(history.difference(), _discardTags));

        delete changeset.id;  // Export without chnageset_id

        const data = JXON.stringify(changeset.osmChangeJXON(changes));
        const blob = new Blob([data], {type: 'text/xml;charset=utf-8;'});
        const fileName = 'changes.osc';

        const linkEnter = container.selectAll('.download-changes')
            .data([0])
            .enter()
            .append('a')
            .attr('class', 'download-changes');

        linkEnter
            .attr('href', window.URL.createObjectURL(blob))
            .attr('download', fileName);

        linkEnter
            .call(svgIcon('#iD-icon-load', 'inline'))
            .append('span')
            .call(t.append('commit.download_changes'));


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


        function click(d3_event, change) {
            if (change.changeType !== 'deleted') {
                const entity = change.entity;
                context.map().zoomToEase(entity);
                context.surface().selectAll(utilEntityOrMemberSelector([entity.id], context.graph()))
                    .classed('hover', true);
            }
        }
    }

    return section;
}
