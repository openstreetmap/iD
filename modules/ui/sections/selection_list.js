import { select as d3_select } from 'd3-selection';

import { presetManager } from '../../presets';
import { modeSelect } from '../../modes/select';
import { osmEntity } from '../../osm';
import { svgIcon } from '../../svg/icon';
import { uiSection } from '../section';
import { t } from '../../core/localizer';
import { utilDisplayName, utilHighlightEntities } from '../../util';

export function uiSectionSelectionList(context) {

    let _selectedIDs = [];

    const section = uiSection('selected-features', context)
        .shouldDisplay(function() {
            return _selectedIDs.length > 1;
        })
        .label(function() {
            return t.append('inspector.title_count', { title: t('inspector.features'), count: _selectedIDs.length });
        })
        .disclosureContent(renderDisclosureContent);

    context.history()
        .on('change.selectionList', function(difference) {
            if (difference) {
                section.reRender();
            }
        });

    section.entityIDs = function(val) {
        if (!arguments.length) return _selectedIDs;
        _selectedIDs = val;
        return section;
    };

    function selectEntity(d3_event, entity) {
        context.enter(modeSelect(context, [entity.id]));
    }

    function deselectEntity(d3_event, entity) {
        const selectedIDs = _selectedIDs.slice();
        const index = selectedIDs.indexOf(entity.id);
        if (index > -1) {
            selectedIDs.splice(index, 1);
            context.enter(modeSelect(context, selectedIDs));
        }
    }

    function renderDisclosureContent(selection) {

        let list = selection.selectAll('.feature-list')
            .data([0]);

        list = list.enter()
            .append('ul')
            .attr('class', 'feature-list')
            .merge(list);

        const entities = _selectedIDs
            .map(function(id) { return context.hasEntity(id); })
            .filter(Boolean);

        let items = list.selectAll('.feature-list-item')
            .data(entities, osmEntity.key);

        items.exit()
            .remove();

        // Enter
        const enter = items.enter()
            .append('li')
            .attr('class', 'feature-list-item')
            .each(function(d) {
                d3_select(this)
                    .on('mouseover', function() {
                        utilHighlightEntities([d.id], true, context);
                    })
                    .on('mouseout', function() {
                        utilHighlightEntities([d.id], false, context);
                    });
            });

        const label = enter
            .append('button')
            .attr('class', 'label')
            .on('click', selectEntity);

        label
            .append('span')
            .attr('class', 'entity-geom-icon')
            .call(svgIcon('', 'pre-text'));

        label
            .append('span')
            .attr('class', 'entity-type');

        label
            .append('span')
            .attr('class', 'entity-name');

        enter
            .append('button')
            .attr('class', 'close')
            .attr('title', t('icons.deselect'))
            .on('click', deselectEntity)
            .call(svgIcon('#iD-icon-close'));

        // Update
        items = items.merge(enter);

        items.selectAll('.entity-geom-icon use')
            .attr('href', function() {
                const entity = this.parentNode.parentNode.__data__;
                return '#iD-icon-' + entity.geometry(context.graph());
            });

        items.selectAll('.entity-type')
            .text(function(entity) { return presetManager.match(entity, context.graph()).name(); });

        items.selectAll('.entity-name')
            .text(function(d) {
                // fetch latest entity
                const entity = context.entity(d.id);
                return utilDisplayName(entity);
            });
    }

    return section;
}
