import * as d3 from 'd3';
import { polygonIntersectsPolygon } from '../geo/index';
import {
    imperial as imperialData,
    driveLeft as driveLeftData,
    imagery as imageryData
} from '../../data/index';

export function Debug(projection, context) {

    function multipolygons(imagery) {
        return imagery.map(function(data) {
            return {
                type: 'MultiPolygon',
                coordinates: [ data.polygon ]
            };
        });
    }

    function drawDebug(surface) {
        var showsTile = context.getDebug('tile'),
            showsCollision = context.getDebug('collision'),
            showsImagery = context.getDebug('imagery'),
            showsImperial = context.getDebug('imperial'),
            showsDriveLeft = context.getDebug('driveLeft'),
            path = d3.geoPath().projection(projection);


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
        if (showsImperial) {
            debugData.push({ class: 'cyan', label: 'imperial' });
        }
        if (showsDriveLeft) {
            debugData.push({ class: 'green', label: 'driveLeft' });
        }


        var legend = d3.select('#content')
            .selectAll('.debug-legend')
            .data(debugData.length ? [0] : []);

        legend.enter()
            .append('div')
            .attr('class', 'fillD debug-legend');

        legend.exit()
            .remove();


        var legendItems = legend.selectAll('.debug-legend-item')
            .data(debugData, function(d) { return d.label; });

        legendItems.enter()
            .append('span')
            .attr('class', function(d) { return 'debug-legend-item ' + d.class; })
            .text(function(d) { return d.label; });

        legendItems.exit()
            .remove();


        var layer = surface.selectAll('.layer-debug')
            .data(showsImagery || showsImperial || showsDriveLeft ? [0] : []);

        layer.enter()
            .append('g')
            .attr('class', 'layer-debug');

        layer.exit()
            .remove();


        var extent = context.map().extent(),
            availableImagery = showsImagery && multipolygons(imageryData.filter(function(source) {
                if (!source.polygon) return false;
                return source.polygon.some(function(polygon) {
                    return polygonIntersectsPolygon(polygon, extent, true);
                });
            }));

        var imagery = layer.selectAll('path.debug-imagery')
            .data(showsImagery ? availableImagery : []);

        imagery.enter()
            .append('path')
            .attr('class', 'debug-imagery debug orange');

        imagery.exit()
            .remove();


        var imperial = layer
            .selectAll('path.debug-imperial')
            .data(showsImperial ? [imperialData] : []);

        imperial.enter()
            .append('path')
            .attr('class', 'debug-imperial debug cyan');

        imperial.exit()
            .remove();


        var driveLeft = layer
            .selectAll('path.debug-drive-left')
            .data(showsDriveLeft ? [driveLeftData] : []);

        driveLeft.enter()
            .append('path')
            .attr('class', 'debug-drive-left debug green');

        driveLeft.exit()
            .remove();


        // update
        layer.selectAll('path')
            .attr('d', path);
    }

    // This looks strange because `enabled` methods on other layers are
    // chainable getter/setters, and this one is just a getter.
    drawDebug.enabled = function() {
        if (!arguments.length) {
            return context.getDebug('tile') ||
                context.getDebug('collision') ||
                context.getDebug('imagery') ||
                context.getDebug('imperial') ||
                context.getDebug('driveLeft');
        } else {
            return this;
        }
    };

    return drawDebug;
}
