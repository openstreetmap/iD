import { t } from '../core/localizer';
import { uiTooltip } from './tooltip';

export function uiFeatureInfo(context) {
    function update(selection) {
        var features = context.features();
        var stats = features.stats();
        var count = 0;
        var hiddenList = features.hidden().map(function(k) {
            if (stats[k]) {
                count += stats[k];
                return t.append('inspector.title_count', {
                    title: t('feature.' + k + '.description'),
                    count: stats[k]
                });
            }
            return null;
        }).filter(Boolean);

        selection.text('');

        if (hiddenList.length) {
            var tooltipBehavior = uiTooltip()
                .placement('top')
                .title(function() {
                    return selection => {
                        hiddenList.forEach(hiddenFeature => {
                            selection.append('div').call(hiddenFeature);
                        });
                    };
                });

            selection.append('a')
                .attr('class', 'chip')
                .attr('href', '#')
                .call(t.append('feature_info.hidden_warning', { count: count }))
                .call(tooltipBehavior)
                .on('click', function(d3_event) {
                    tooltipBehavior.hide();
                    d3_event.preventDefault();
                    
                    // open the Map Data pane
                    var mapDataPane = context.container().select('.map-panes .map-data-pane');
                    context.ui().togglePanes(mapDataPane);
                    
                    // Wait for pane to render, then expand Map Features section and scroll to it
                    setTimeout(function() {
                        var mapFeaturesSection = mapDataPane.select('.section-map-features');
                        if (!mapFeaturesSection.empty()) {
                            var disclosure = mapFeaturesSection.select('.hide-toggle-map_features');
                            var disclosureWrap = mapFeaturesSection.select('.disclosure-wrap-map_features');
                            
                            // Expand the disclosure if it's not already expanded
                            if (!disclosure.classed('expanded')) {
                                disclosure.node().click();
                            }
                            
                            // Scroll to the map features section
                            setTimeout(function() {
                                var sectionNode = mapFeaturesSection.node();
                                if (sectionNode) {
                                    sectionNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, 100);
                        }
                    }, 100);
                });
        }

        selection
            .classed('hide', !hiddenList.length);
    }


    return function(selection) {
        update(selection);

        context.features().on('change.feature_info', function() {
            update(selection);
        });
    };
}
