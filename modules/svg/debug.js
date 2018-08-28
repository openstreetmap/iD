import _values from 'lodash-es/values';

import { select as d3_select } from 'd3-selection';

import { data, dataImperial, dataDriveLeft } from '../../data';
import { svgPath } from './index';


export function svgDebug(projection, context) {

    function drawDebug(selection) {
        var showsTile = context.getDebug('tile');
        var showsCollision = context.getDebug('collision');
        var showsImagery = context.getDebug('imagery');
        var showsCommunity = context.getDebug('community');
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
        if (showsCommunity) {
            debugData.push({ class: 'blue', label: 'community' });
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
            .data(showsImagery || showsCommunity || showsImperial || showsDriveLeft ? [0] : []);

        layer.exit()
            .remove();

        layer = layer.enter()
            .append('g')
            .attr('class', 'layer-debug')
            .merge(layer);


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


        var community = layer.selectAll('path.debug-community')
            .data(showsCommunity ? _values(data.community.features) : []);

        community.exit()
            .remove();

        community.enter()
            .append('path')
            .attr('class', 'debug-community debug blue');


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
