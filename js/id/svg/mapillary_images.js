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

    function showViewer(image) {
        var mapillary = getMapillary();
        if (!mapillary) return;

        mapillary.showViewer(image.key);

        if (!_viewer) {
            _viewer = iD.services.mapillary.viewer;
            _viewer.on('nodechanged', viewerNavHandler);

            // To avoid edge case, when network is too slow and user clicks on multiple viewfield-groups
            _viewer.on('loadingchanged', function(s) {
                // if (!s && pendingImg) {
                //     d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
                //         .classed('loading', function() { return false; });
                //     mapillary.selectedImage(pendingImg);
                //     context.map().centerEase(pendingImg.loc);
                //     showViewer(pendingImg);
                //     pendingImg = null;
                // }
                // _mlyLoading = s;
            });
        }
    }

    function hideViewer() {
        var mapillary = getMapillary();
        if (mapillary) {
            mapillary.hideViewer();
        } else {
            d3.select('#content').selectAll('.mapillary-wrap')
                .remove();
        }

        if (_viewer) {
            _viewer.off('nodechanged');
            _viewer.off('loadingchanged');
            _viewer = null;
        }

        _mlyLoading = null;
        pendingImg = null;
    }

    function showLayer() {
        var mapillary = getMapillary();
        if (!mapillary) return;
        mapillary.initViewer();

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
        hideViewer();
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

    function click(d) {
        var mapillary = getMapillary();
        if (!mapillary) return;

        var image = mapillary.selectedImage();
        if (image && image.key === d.key) return;

        if (_mlyLoading) {
            showLoading(d);
        } else {
            mapillary.selectedImage(d);
            context.map().centerEase(d.loc);
            showViewer(d);
        }
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
            .attr('class', 'viewfield-group')
            .on('click', click);

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
            .style('display', enabled ? 'block' : 'none');

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

        var image = mapillary.selectedImage();
        if (!image || image.key === node.key) return;

        d3.selectAll('.layer-mapillary-images .viewfield-group, .layer-mapillary-signs .icon-sign')
            .classed('selected', function(d) {
                if (d.key === node.key) {
                    mapillary.selectedImage(d);
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
