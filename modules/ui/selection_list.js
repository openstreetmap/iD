import { event as d3_event, select as d3_select } from 'd3-selection';

import { modeSelect } from '../modes/select';
import { osmEntity } from '../osm';
import { svgIcon } from '../svg/icon';
import { uiDisclosure } from './disclosure';
import { t } from '../util/locale';
import { utilDisplayName, utilHighlightEntities } from '../util';


export function uiSelectionList(context) {

    var _selectedIDs = [];
    var _selection = d3_select(null);

    context.history()
        .on('change.selectionList', function(difference) {
            if (difference) {
                _selection.selectAll('.disclosure-wrap')
                    .call(render);

                updateTitle();
            }
        });

    function selectionList(selection) {
        _selection = selection;

        selection
            .call(uiDisclosure(context, 'selected_features', true)
                .content(render)
            );

        updateTitle();
    }

    selectionList.selectedIDs = function(val) {
        if (!arguments.length) return _selectedIDs;
        _selectedIDs = val;
        return selectionList;
    };

    function selectEntity(entity) {
        context.enter(modeSelect(context, [entity.id]));
    }

    function deselectEntity(entity) {
        d3_event.stopPropagation();

        var selectedIDs = _selectedIDs.slice();
        var index = selectedIDs.indexOf(entity.id);
        if (index > -1) {
            selectedIDs.splice(index, 1);
            context.enter(modeSelect(context, selectedIDs));
        }
    }

    function render(selection) {

        var list = selection.selectAll('.feature-list')
            .data([0]);

        list = list.enter()
            .append('div')
            .attr('class', 'feature-list')
            .merge(list);

        var entities = _selectedIDs
            .map(function(id) { return context.hasEntity(id); })
            .filter(Boolean);

        var items = list.selectAll('.feature-list-item')
            .data(entities, osmEntity.key);

        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('div')
            .attr('class', 'feature-list-item')
            .on('click', selectEntity);

        enter
            .each(function(d) {
                d3_select(this).on('mouseover', function() {
                    utilHighlightEntities([d.id], true, context);
                });
                d3_select(this).on('mouseout', function() {
                    utilHighlightEntities([d.id], false, context);
                });
            });

        var label = enter
            .append('button')
            .attr('class', 'label');

        enter
            .append('button')
            .attr('class', 'close')
            .attr('title', t('icons.deselect'))
            .on('click', deselectEntity)
            .call(svgIcon('#iD-icon-close'));

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

        // Update
        items = items.merge(enter);

        items.selectAll('.entity-geom-icon use')
            .attr('href', function() {
                var entity = this.parentNode.parentNode.__data__;
                return '#iD-icon-' + context.geometry(entity.id);
            });

        items.selectAll('.entity-type')
            .text(function(entity) { return context.presets().match(entity, context.graph()).name(); });

        items.selectAll('.entity-name')
            .text(function(d) {
                // fetch latest entity
                var entity = context.entity(d.id);
                return utilDisplayName(entity);
            });
    }

    function updateTitle() {
        _selection.selectAll('.hide-toggle span')
            .text(t('inspector.features_count', { count: _selectedIDs.length }));
    }

    return selectionList;
}
