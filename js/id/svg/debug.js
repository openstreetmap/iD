iD.svg.Debug = function(projection, context) {

    function drawDebug(surface) {
        var showsImagery = context.getDebug('imagery'),
            showsImperial = context.getDebug('imperial'),
            showsDriveLeft = context.getDebug('driveLeft'),
            enabled = showsImagery || showsImperial || showsDriveLeft,
            path = d3.geo.path().projection(projection);

        var layer = surface.selectAll('.layer-debug')
            .data(enabled ? [0] : []);

        layer.enter()
            .append('g')
            .attr('class', 'layer-debug');

        layer.exit()
            .remove();


        var legend = d3.select('#content')
            .selectAll('#debugLegend')
            .data(enabled ? [0] : []);

        legend.enter()
            .append('div')
            .attr('id', 'debugLegend')
            .attr('class', 'fillD')
            .attr('style', 'position:absolute; top:70px; right:80px; padding:5px;');

        legend.exit()
            .remove();


        var imagery = layer.selectAll('path.debug-imagery')
            .data(showsImagery ? [] : []);  // TODO

        imagery.enter()
            .append('path')
            .attr('class', 'debug-imagery debug orange');

        imagery.exit()
            .remove();


        var imperial = layer
            .selectAll('path.debug-imperial')
            .data(showsImperial ? [iD.data.imperial] : []);

        imperial.enter()
            .append('path')
            .attr('class', 'debug-imperial debug cyan');

        imperial.exit()
            .remove();


        var driveLeft = layer
            .selectAll('path.debug-drive-left')
            .data(showsDriveLeft ? [iD.data.driveLeft] : []);

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
            return context.getDebug('imagery') ||
                context.getDebug('imperial') ||
                context.getDebug('driveLeft');
        } else {
            return this;
        }
    };

    return drawDebug;
};
