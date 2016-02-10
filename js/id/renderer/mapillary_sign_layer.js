iD.MapillarySignLayer = function(context) {
    var mapillary = iD.services.mapillary(),
        debouncedRedraw = _.debounce(function () { context.pan([0,0]); }, 1000),
        rtree = rbush(),
        enabled = false,
        layer;


    function showThumbnail(imageKey) {
        var thumb = mapillary.selectedThumbnail();

        d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
            .classed('selected', function(d) { return d.key === thumb; });

        mapillary.showThumbnail(context.container(), imageKey);
    }

    function hideThumbnail() {
        d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
            .classed('selected', false);

        mapillary.hideThumbnail(context.container());
    }

    function showLayer() {
        layer.style('display', 'block');
        debouncedRedraw();
    }

    function hideLayer() {
        debouncedRedraw.cancel();
        hideThumbnail();
        layer.selectAll('.icon-sign').remove();
        layer.style('display', 'none');
    }

    function signsLoaded(data) {
        if (!data.features.length) return;

        var signs = [],
            sign, loc;

        for (var i = 0; i < data.features.length; i++) {
            sign = data.features[i];
            loc = sign.geometry.coordinates;
            signs.push([loc[0], loc[1], loc[0], loc[1], {
                key: sign.properties.key,
                signs: sign.properties.rects,
                loc: loc
            }]);
        }

        rtree.load(signs);
        debouncedRedraw();
    }

    function drawSigns() {
        var data = rtree
            .search(context.map().extent().rectangle())
            .map(function(d) { return d[4]; });

        var signs = layer.select('.mapillary-sign-offset')
            .selectAll('.icon-sign')
            .data(data, function(d) { return d.key; });

        // Enter
        var enter = signs.enter()
            .append('foreignObject')
            .attr('class', 'icon-sign')
            .attr('width', '32px')      // for Firefox
            .attr('height', '32px');    // for Firefox

        enter
            .append('xhtml:body')
            .html(mapillary.signHTML);

        enter
            .on('click', function(d) {   // deselect/select
                if (d.key === mapillary.selectedThumbnail()) {
                    hideThumbnail();
                } else {
                    mapillary.selectedThumbnail(d.key);
                    showThumbnail(d.key);
                }
            })
            .on('mouseover', function(d) {
                showThumbnail(d.key);
            })
            .on('mouseout', function() {
                var thumb = mapillary.selectedThumbnail();
                if (thumb) {
                    showThumbnail(thumb);
                } else {
                    hideThumbnail();
                }
            });

        // Update
        signs
            .attr('transform', iD.svg.PointTransform(context.projection));

        // Exit
        signs.exit()
            .remove();
    }

    function render(selection) {
        layer = selection.selectAll('svg')
            .data([0]);

        layer.enter()
            .append('svg')
            .style('display', enabled ? 'block' : 'none')
            .append('g')
            .attr('class', 'mapillary-sign-offset')
            .attr('transform', 'translate(-16, -16)');  // center signs on loc

        if (enabled) {
            drawSigns();
            mapillary.loadSigns(context, context.projection, layer.dimensions());
        }
    }

    render.enable = function(_) {
        if (!arguments.length) return enabled;
        enabled = _;
        if (enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        return render;
    };

    render.dimensions = function(_) {
        if (!arguments.length) return layer.dimensions();
        layer.dimensions(_);
        return render;
    };


    mapillary
        .on('loadedSigns', signsLoaded);

    return render;
};
