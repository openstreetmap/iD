iD.MapillarySignLayer = function(context) {
    var mapillary = iD.services.mapillary(),
        debouncedRedraw = _.debounce(function () { context.pan([0,0]); }, 1000),
        enabled = false,
        minZoom = 12,
        layer;


    function showThumbnail(image) {
        var thumb = mapillary.selectedThumbnail(),
            posX = context.projection(image.loc)[0],
            width = layer.dimensions()[0],
            position = (posX < width / 2) ? 'right' : 'left';

        if (thumb) {
            d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
                .classed('selected', function(d) { return d.key === thumb.key; });
        }

        mapillary.showThumbnail(image.key, position);
    }

    function hideThumbnail() {
        d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
            .classed('selected', false);

        mapillary.hideThumbnail();
    }

    function showLayer() {
        editOn();
        debouncedRedraw();
    }

    function hideLayer() {
        debouncedRedraw.cancel();
        hideThumbnail();
        editOff();
    }

    function editOn() {
        layer.style('display', 'block');
    }

    function editOff() {
        layer.selectAll('.icon-sign').remove();
        layer.style('display', 'none');
    }

    function drawSigns() {
        var data = mapillary.signs(context);

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
                var thumb = mapillary.selectedThumbnail();
                if (thumb && thumb.key === d.key) {
                    hideThumbnail();
                } else {
                    mapillary.selectedThumbnail(d);
                    context.map().centerEase(d.loc);
                    showThumbnail(d);
                }
            })
            .on('mouseover', showThumbnail)
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
            if (~~context.map().zoom() < minZoom) {
                hideLayer();
            } else {
                layer.style('display', 'block');
                drawSigns();
                mapillary.loadSigns(context, context.projection, layer.dimensions());
            }
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
        .on('loadedSigns', debouncedRedraw);

    return render;
};
