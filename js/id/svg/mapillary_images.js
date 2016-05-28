iD.svg.MapillaryImages = function(projection, context, dispatch) {
    var debouncedRedraw = _.debounce(function () { dispatch.change(); }, 1000),
        minZoom = 12,
        layer = d3.select(null),
        _mapillary, _viewer, _mlyLoading, pendingImg;


    function init() {
        if (iD.svg.MapillaryImages.initialized) return;  // run once
        iD.svg.MapillaryImages.enabled = false;
        iD.svg.MapillaryImages.initialized = true;
    }

    function getMapillary() {
        if (iD.services.mapillary && !_mapillary) {
            _mapillary = iD.services.mapillary().on('loadedImages', debouncedRedraw);
        } else if (!iD.services.mapillary && _mapillary) {
            _mapillary = null;
        }
        return _mapillary;
    }

    function showLoading(image) {
        var mapillary = getMapillary();
        if (!mapillary) return;
        pendingImg = image;
        d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
            .classed('loading', function(d) { return d.key === image.key; });
    }

    function showThumbnail(image) {
        var mapillary = getMapillary();
        if (!mapillary) return;

        var thumb = mapillary.selectedThumbnail();
        if (thumb) {
            d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
                .classed('selected', function(d) { return d.key === thumb.key; });
        }

        mapillary.showThumbnail(image.key);

        if (!_viewer) {
            _viewer = iD.services.mapillary.viewer;
            _viewer.on('nodechanged', viewerNavHandler);

            // To avoid edge case, when network is too slow and  user clicks on multiple
            // viewfield-groups.
            _viewer.on('loadingchanged', function(s) {
                if (!s && pendingImg) {
                    d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
                        .classed('loading', function() { return false; });
                    mapillary.selectedThumbnail(pendingImg);
                    context.map().centerEase(pendingImg.loc);
                    showThumbnail(pendingImg);
                    pendingImg = null;
                }
                _mlyLoading = s;
            });
        }
    }

    function removeThumbnail(permanent) {
        d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
            .classed('selected', false);

        var mapillary = getMapillary();
        if (mapillary) {
            if (permanent) return mapillary.killThumbnail();
            return mapillary.hideThumbnail();
        }
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
        removeThumbnail(true);
        if (_viewer) {
            _viewer.off('nodechanged');
            _viewer.off('loadingchanged');
        }
        _mlyLoading = null;
        pendingImg = null;
        _viewer = null;

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
        var t = iD.svg.PointTransform(projection)(d);
        if (d.ca) t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
        return t;
    }

    function update() {
        var mapillary = getMapillary(),
            data = (mapillary ? mapillary.images(projection, layer.dimensions()) : []);

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

        // Exit
        markers.exit()
            .remove();

        // Update
        markers
            .attr('transform', transform);
    }

    function drawImages(selection) {
        var enabled = iD.svg.MapillaryImages.enabled,
            mapillary = getMapillary();

        layer = selection.selectAll('.layer-mapillary-images')
            .data(mapillary ? [0] : []);

        layer.enter()
            .append('g')
            .attr('class', 'layer-mapillary-images')
            .style('display', enabled ? 'block' : 'none')
            .on('click', function() {
                var mapillary = getMapillary();
                if (!mapillary) return;

                var d = d3.event.target.__data__,
                    thumb = mapillary.selectedThumbnail();

                if (thumb && thumb.key === d.key) return;

                if (_mlyLoading) {
                    showLoading(d);
                } else {
                    mapillary.selectedThumbnail(d);
                    context.map().centerEase(d.loc);
                    showThumbnail(d);
                }
            });

        layer.exit()
            .remove();

        if (enabled) {
            if (mapillary && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                mapillary.loadImages(projection, layer.dimensions());
            } else {
                editOff();
            }
        }
    }

    function viewerNavHandler(node) {
        var mapillary = getMapillary();
        if (!mapillary) return;

        var thumb = mapillary.selectedThumbnail();
        if (!thumb || thumb.key === node.key) return;

        d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
            .classed('selected', function(d) {
                if (d.key === node.key) {
                    mapillary.selectedThumbnail(d);
                    context.map().centerEase(d.loc);
                    return true;
                }
            });
    }

    drawImages.enabled = function(_) {
        if (!arguments.length) return iD.svg.MapillaryImages.enabled;
        iD.svg.MapillaryImages.enabled = _;
        if (iD.svg.MapillaryImages.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.change();
        return this;
    };

    drawImages.supported = function() {
        return !!getMapillary();
    };

    drawImages.dimensions = function(_) {
        if (!arguments.length) return layer.dimensions();
        layer.dimensions(_);
        return this;
    };

    init();
    return drawImages;
};
