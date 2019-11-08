import { select as d3_select } from 'd3-selection';

import { data } from '../../data';
import { svgPath } from './helpers';


export function svgDebug(projection, context) {

    function drawDebug(selection) {
        var showsTile = context.getDebug('tile');
        var showsCollision = context.getDebug('collision');
        var showsImagery = context.getDebug('imagery');
        var showsCommunity = context.getDebug('community');
        var showsTouchTargets = context.getDebug('target');
        var showsDownloaded = context.getDebug('downloaded');

        var debugData = [];
        if (showsTile) {
            debugData.push({ class: 'red', label: 'tile' });
        }
        if (showsCollision) {
            debugData.push({ class: 'yellow', label: 'collision' });
        }
        if (showsImagery) {
            debugData.push({ class: 'orange', label: 'imagery' });
        }
        if (showsCommunity) {
            debugData.push({ class: 'blue', label: 'community' });
        }
        if (showsTouchTargets) {
            debugData.push({ class: 'pink', label: 'touchTargets' });
        }
        if (showsDownloaded) {
            debugData.push({ class: 'purple', label: 'downloaded' });
        }


        var legend = d3_select('#content')
            .selectAll('.debug-legend')
            .data(debugData.length ? [0] : []);

        legend.exit()
            .remove();

        legend = legend.enter()
            .append('div')
            .attr('class', 'fillD debug-legend')
            .merge(legend);


        var legendItems = legend.selectAll('.debug-legend-item')
            .data(debugData, function(d) { return d.label; });

        legendItems.exit()
            .remove();

        legendItems.enter()
            .append('span')
            .attr('class', function(d) { return 'debug-legend-item ' + d.class; })
            .text(function(d) { return d.label; });


        var layer = selection.selectAll('.layer-debug')
            .data(showsImagery || showsCommunity || showsDownloaded ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-debug')
            .merge(layer);


        // imagery
        var extent = context.map().extent();
        var matchImagery = (showsImagery && data.imagery.query.bbox(extent.rectangle(), true)) || [];
        var features = matchImagery.map(function(d) { return data.imagery.features[d.id]; });

        var imagery = layer.selectAll('path.debug-imagery')
            .data(features);

        imagery.exit()
            .remove();

        imagery.enter()
            .append('path')
            .attr('class', 'debug-imagery debug orange');


        // community index
        var community = layer.selectAll('path.debug-community')
            .data(showsCommunity ? Object.values(data.community.features) : []);

        community.exit()
            .remove();

        community.enter()
            .append('path')
            .attr('class', 'debug-community debug blue');


        // downloaded
        var osm = context.connection();
        var dataDownloaded = [];

        if (osm) {
            var rtree = osm.caches('get').tile.rtree;
            dataDownloaded = rtree.all().map(function(bbox) {
                return {
                    type: 'Feature',
                    properties: { id: bbox.id },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [ bbox.minX, bbox.minY ],
                            [ bbox.minX, bbox.maxY ],
                            [ bbox.maxX, bbox.maxY ],
                            [ bbox.maxX, bbox.minY ],
                            [ bbox.minX, bbox.minY ]
                        ]]
                    }
                };
            });
        }


        var downloaded = layer
            .selectAll('path.debug-downloaded')
            .data(showsDownloaded ? dataDownloaded : []);

        downloaded.exit()
            .remove();

        downloaded.enter()
            .append('path')
            .attr('class', 'debug-downloaded debug purple');


        // update
        layer.selectAll('path')
            .attr('d', svgPath(projection).geojson);
    }


    // This looks strange because `enabled` methods on other layers are
    // chainable getter/setters, and this one is just a getter.
    drawDebug.enabled = function() {
        if (!arguments.length) {
            return context.getDebug('tile') ||
                context.getDebug('collision') ||
                context.getDebug('imagery') ||
                context.getDebug('target') ||
                context.getDebug('downloaded');
        } else {
            return this;
        }
    };


    return drawDebug;
}
