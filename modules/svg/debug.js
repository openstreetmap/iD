import { select as d3_select } from 'd3-selection';

import { geoPolygonIntersectsPolygon } from '../geo';
import { data, dataImperial, dataDriveLeft } from '../../data';
import { svgPath } from './index';


export function svgDebug(projection, context) {

    function multipolygons(imagery) {
        return imagery.map(function(data) {
            return {
                type: 'MultiPolygon',
                coordinates: [ data.polygon ]
            };
        });
    }

    function drawDebug(selection) {
        var showsTile = context.getDebug('tile');
        var showsCollision = context.getDebug('collision');
        var showsImagery = context.getDebug('imagery');
        var showsImperial = context.getDebug('imperial');
        var showsDriveLeft = context.getDebug('driveLeft');
        var showsTouchTargets = context.getDebug('target');

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
        if (showsTouchTargets) {
            debugData.push({ class: 'pink', label: 'touchTargets' });
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
            .data(showsImagery || showsImperial || showsDriveLeft ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-debug')
            .merge(layer);


        var extent = context.map().extent();
        var dataImagery = data.imagery || [];
        var availableImagery = showsImagery && multipolygons(dataImagery.filter(function(source) {
            if (!source.polygon) return false;
            return source.polygon.some(function(polygon) {
                return geoPolygonIntersectsPolygon(polygon, extent, true);
            });
        }));

        var imagery = layer.selectAll('path.debug-imagery')
            .data(showsImagery ? availableImagery : []);

        imagery.exit()
            .remove();

        imagery.enter()
            .append('path')
            .attr('class', 'debug-imagery debug orange');


        var imperial = layer
            .selectAll('path.debug-imperial')
            .data(showsImperial ? [dataImperial] : []);

        imperial.exit()
            .remove();

        imperial.enter()
            .append('path')
            .attr('class', 'debug-imperial debug cyan');


        var driveLeft = layer
            .selectAll('path.debug-drive-left')
            .data(showsDriveLeft ? [dataDriveLeft] : []);

        driveLeft.exit()
            .remove();

        driveLeft.enter()
            .append('path')
            .attr('class', 'debug-drive-left debug green');


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
                context.getDebug('imperial') ||
                context.getDebug('driveLeft') ||
                context.getDebug('target');
        } else {
            return this;
        }
    };


    return drawDebug;
}
