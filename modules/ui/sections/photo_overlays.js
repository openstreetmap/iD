import {
    select as d3_select
} from 'd3-selection';

import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';
import { utilGetSetValue, utilNoAuto } from '../../util';

export function uiSectionPhotoOverlays(context) {

    var layers = context.layers();

    var section = uiSection('photo-overlays', context)
        .label(() => t.append('photo_overlays.title'))
        .disclosureContent(renderDisclosureContent)
        .expandedByDefault(false);

    function renderDisclosureContent(selection) {
        var container = selection.selectAll('.photo-overlay-container')
            .data([0]);

        container.enter()
            .append('div')
            .attr('class', 'photo-overlay-container')
            .merge(container)
            .call(drawPhotoItems)
            .call(drawPhotoTypeItems)
            .call(drawDateFilter)
            .call(drawUsernameFilter);
    }

    function drawPhotoItems(selection) {
        var photoKeys = context.photos().overlayLayerIDs();
        var photoLayers = layers.all().filter(function(obj) { return photoKeys.indexOf(obj.id) !== -1; });
        var data = photoLayers.filter(function(obj) { return obj.layer.supported(); });

        function layerSupported(d) {
            return d.layer && d.layer.supported();
        }
        function layerEnabled(d) {
            return layerSupported(d) && d.layer.enabled();
        }

        var ul = selection
            .selectAll('.layer-list-photos')
            .data([0]);

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-photos')
            .merge(ul);

        var li = ul.selectAll('.list-item-photos')
            .data(data);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', function(d) {
                var classes = 'list-item-photos list-item-' + d.id;
                if (d.id === 'mapillary-signs' || d.id === 'mapillary-map-features') {
                    classes += ' indented';
                }
                return classes;
            });

        var labelEnter = liEnter
            .append('label')
            .each(function(d) {
                var titleID;
                if (d.id === 'mapillary-signs') titleID = 'mapillary.signs.tooltip';
                else if (d.id === 'mapillary') titleID = 'mapillary_images.tooltip';
                else if (d.id === 'kartaview') titleID = 'kartaview_images.tooltip';
                else titleID = d.id.replace(/-/g, '_') + '.tooltip';
                d3_select(this)
                    .call(uiTooltip()
                        .title(() => t.append(titleID))
                        .placement('top')
                    );
            });

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event, d) { toggleLayer(d.id); });

        labelEnter
            .append('span')
            .html(function(d) {
                var id = d.id;
                if (id === 'mapillary-signs') id = 'photo_overlays.traffic_signs';
                return t.html(id.replace(/-/g, '_') + '.title');
            });

        // Update
        li
            .merge(liEnter)
            .classed('active', layerEnabled)
            .selectAll('input')
            .property('checked', layerEnabled);
    }

    function drawPhotoTypeItems(selection) {
        var data = context.photos().allPhotoTypes();

        function typeEnabled(d) {
            return context.photos().showsPhotoType(d);
        }

        var ul = selection
            .selectAll('.layer-list-photo-types')
            .data([0]);

        ul.exit()
            .remove();

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-photo-types')
            .merge(ul);

        var li = ul.selectAll('.list-item-photo-types')
            .data(context.photos().shouldFilterByPhotoType() ? data : []);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', function(d) {
                return 'list-item-photo-types list-item-' + d;
            });

        var labelEnter = liEnter
            .append('label')
            .each(function(d) {
                d3_select(this)
                    .call(uiTooltip()
                        .title(() => t.append('photo_overlays.photo_type.' + d + '.tooltip'))
                        .placement('top')
                    );
            });

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event, d) {
                context.photos().togglePhotoType(d);
            });

        labelEnter
            .append('span')
            .html(function(d) {
                return t.html('photo_overlays.photo_type.' + d + '.title');
            });


        // Update
        li
            .merge(liEnter)
            .classed('active', typeEnabled)
            .selectAll('input')
            .property('checked', typeEnabled);
    }

    function drawDateFilter(selection) {
        var data = context.photos().dateFilters();

        function filterEnabled(d) {
            return context.photos().dateFilterValue(d);
        }

        var ul = selection
            .selectAll('.layer-list-date-filter')
            .data([0]);

        ul.exit()
            .remove();

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-date-filter')
            .merge(ul);

        var li = ul.selectAll('.list-item-date-filter')
            .data(context.photos().shouldFilterByDate() ? data : []);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', 'list-item-date-filter');

        var labelEnter = liEnter
            .append('label')
            .each(function(d) {
                d3_select(this)
                    .call(uiTooltip()
                        .title(() => t.append('photo_overlays.date_filter.' + d + '.tooltip'))
                        .placement('top')
                    );
            });

        labelEnter
            .append('span')
            .each(function(d) {
                t.append('photo_overlays.date_filter.' + d + '.title')(d3_select(this));
            });

        labelEnter
            .append('input')
            .attr('type', 'date')
            .attr('class', 'list-item-input')
            .attr('placeholder', t('units.year_month_day'))
            .call(utilNoAuto)
            .each(function(d) {
                utilGetSetValue(d3_select(this), context.photos().dateFilterValue(d) || '');
            })
            .on('change', function(d3_event, d) {
                var value = utilGetSetValue(d3_select(this)).trim();
                context.photos().setDateFilter(d, value, true);
                // reload the displayed dates
                li.selectAll('input')
                    .each(function(d) {
                        utilGetSetValue(d3_select(this), context.photos().dateFilterValue(d) || '');
                    });
            });

        li = li
            .merge(liEnter)
            .classed('active', filterEnabled);
    }

    function drawUsernameFilter(selection) {
        function filterEnabled() {
            return context.photos().usernames();
        }
        var ul = selection
            .selectAll('.layer-list-username-filter')
            .data([0]);

        ul.exit()
            .remove();

        ul = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-username-filter')
            .merge(ul);

        var li = ul.selectAll('.list-item-username-filter')
            .data(context.photos().shouldFilterByUsername() ? ['username-filter'] : []);

        li.exit()
            .remove();

        var liEnter = li.enter()
            .append('li')
            .attr('class', 'list-item-username-filter');

        var labelEnter = liEnter
            .append('label')
            .each(function() {
                d3_select(this)
                    .call(uiTooltip()
                        .title(() => t.append('photo_overlays.username_filter.tooltip'))
                        .placement('top')
                    );
            });

        labelEnter
            .append('span')
            .call(t.append('photo_overlays.username_filter.title'));

        labelEnter
            .append('input')
            .attr('type', 'text')
            .attr('class', 'list-item-input')
            .call(utilNoAuto)
            .property('value', usernameValue)
            .on('change', function() {
                var value = d3_select(this).property('value');
                context.photos().setUsernameFilter(value, true);
                d3_select(this).property('value', usernameValue);
            });

        li
            .merge(liEnter)
            .classed('active', filterEnabled);

        function usernameValue() {
            var usernames = context.photos().usernames();
            if (usernames) return usernames.join('; ');
            return usernames;
        }
    }

    function toggleLayer(which) {
        setLayer(which, !showsLayer(which));
    }

    function showsLayer(which) {
        var layer = layers.layer(which);
        if (layer) {
            return layer.enabled();
        }
        return false;
    }

    function setLayer(which, enabled) {
        var layer = layers.layer(which);
        if (layer) {
            layer.enabled(enabled);
        }
    }

    context.layers().on('change.uiSectionPhotoOverlays', section.reRender);
    context.photos().on('change.uiSectionPhotoOverlays', section.reRender);

    return section;
}
