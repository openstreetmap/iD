iD.MapillaryImageLayer = function(context) {
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
        layer
            .style('opacity', 0)
            .transition()
            .duration(500)
            .style('opacity', 1)
            .each('end', debouncedRedraw);
    }

    function hideLayer() {
        debouncedRedraw.cancel();
        hideThumbnail();
        layer
            .transition()
            .duration(500)
            .style('opacity', 0)
            .each('end', editOff);
    }

    function editOn() {
        layer.style('display', 'block');
    }

    function editOff() {
        layer.selectAll('.viewfield-group').remove();
        layer.style('display', 'none');
    }

    function transform(d) {
        var t = iD.svg.PointTransform(context.projection)(d);
        if (d.ca) t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
        return t;
    }

    function drawMarkers() {
        var data = mapillary.images(context);

        var markers = layer.selectAll('.viewfield-group')
            .data(data, function(d) { return d.key; });

        // Enter
        var enter = markers.enter()
            .append('g')
            .attr('class', 'viewfield-group');

        enter.append('path')
            .attr('class', 'viewfield')
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .attr('d', 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z');

        enter.append('circle')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('r', '6');

        // Update
        markers
            .attr('transform', transform);

        // Exit
        markers.exit()
            .remove();
    }

    function render(selection) {
        layer = selection.selectAll('svg')
            .data([0]);

        // Enter
        layer.enter()
            .append('svg')
            .style('display', enabled ? 'block' : 'none')
            .on('click', function() {   // deselect/select
                var d = d3.event.target.__data__,
                    thumb = mapillary.selectedThumbnail();
                if (thumb && thumb.key === d.key) {
                    hideThumbnail();
                } else {
                    mapillary.selectedThumbnail(d);
                    context.map().centerEase(d.loc);
                    showThumbnail(d);
                }
            })
            .on('mouseover', function() {
                showThumbnail(d3.event.target.__data__);
            })
            .on('mouseout', function() {
                var thumb = mapillary.selectedThumbnail();
                if (thumb) {
                    showThumbnail(thumb);
                } else {
                    hideThumbnail();
                }
            });

        if (enabled) {
            if (~~context.map().zoom() < minZoom) {
                editOff();
            } else {
                editOn();
                drawMarkers();
                mapillary.loadImages(context.projection, layer.dimensions());
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
        .on('loadedImages', debouncedRedraw);

    return render;
};
