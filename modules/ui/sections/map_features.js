import { t } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { uiSection } from '../section';

export function uiSectionMapFeatures(context) {

    var _features = context.features().keys();

    var section = uiSection('map-features', context)
        .title(t('map_data.map_features'))
        .disclosureContent(renderDisclosureContent)
        .expandedByDefault(false);

    function renderDisclosureContent(selection) {

        var container = selection.selectAll('.layer-feature-list-container')
            .data([0]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'layer-feature-list-container');

        containerEnter
            .append('ul')
            .attr('class', 'layer-list layer-feature-list');

        var footer = containerEnter
            .append('div')
            .attr('class', 'feature-list-links section-footer');

        footer
            .append('a')
            .attr('class', 'feature-list-link')
            .attr('href', '#')
            .text(t('issues.enable_all'))
            .on('click', function() {
                context.features().enableAll();
            });

        footer
            .append('a')
            .attr('class', 'feature-list-link')
            .attr('href', '#')
            .text(t('issues.disable_all'))
            .on('click', function() {
                context.features().disableAll();
            });

        // Update
        container = container
            .merge(containerEnter);

        container.selectAll('.layer-feature-list')
            .call(drawListItems, _features, 'checkbox', 'feature', clickFeature, showsFeature);
    }

    function drawListItems(selection, data, type, name, change, active) {
        var items = selection.selectAll('li')
            .data(data);

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('li')
            .call(uiTooltip()
                .title(function(d) {
                    var tip = t(name + '.' + d + '.tooltip');
                    if (autoHiddenFeature(d)) {
                        var msg = showsLayer('osm') ? t('map_data.autohidden') : t('map_data.osmhidden');
                        tip += '<div>' + msg + '</div>';
                    }
                    return tip;
                })
                .placement('top')
            );

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);

        label
            .append('span')
            .text(function(d) { return t(name + '.' + d + '.description'); });

        // Update
        items = items
            .merge(enter);

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active)
            .property('indeterminate', autoHiddenFeature);
    }

    function autoHiddenFeature(d) {
        return context.features().autoHidden(d);
    }

    function showsFeature(d) {
        return context.features().enabled(d);
    }

    function clickFeature(d) {
        context.features().toggle(d);
    }

    function showsLayer(id) {
        var layer = context.layers().layer(id);
        return layer && layer.enabled();
    }

    // add listeners
    context.features()
        .on('change.map_features', section.reRender);

    return section;
}
