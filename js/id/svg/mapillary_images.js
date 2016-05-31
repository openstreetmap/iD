iD.svg.MapillaryImages = function(projection, context, dispatch) {
    var debouncedRedraw = _.debounce(function () { dispatch.change(); }, 1000),
        minZoom = 12,
        layer = d3.select(null),
        _clicks = [],
        _mapillary, _viewer;


    function init() {
        if (iD.svg.MapillaryImages.initialized) return;  // run once
        iD.svg.MapillaryImages.enabled = false;
        iD.svg.MapillaryImages.initialized = true;
    }

    function getMapillary() {
        if (iD.services.mapillary && !_mapillary) {
            _mapillary = iD.services.mapillary();
            _mapillary.on('loadedImages', debouncedRedraw);
        } else if (!iD.services.mapillary && _mapillary) {
            _mapillary = null;
        }

        if (iD.services.mapillary && !_viewer) {
            _viewer = iD.services.mapillary.viewer;
            if (_viewer) {
                _viewer.on('nodechanged', nodeChanged);
            }
        } else if (!iD.services.mapillary && _viewer) {
            _viewer = null;
        }

        return _mapillary;
    }

    function showLayer() {
        var mapillary = getMapillary();
        if (!mapillary) return;
        mapillary.loadViewer();

        editOn();

        layer
            .style('opacity', 0)
            .transition()
            .duration(500)
            .style('opacity', 1)
            .each('end', debouncedRedraw);
    }

    function hideLayer() {
        var mapillary = getMapillary();
        if (mapillary) {
            mapillary.hideViewer();
        }

        debouncedRedraw.cancel();

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

        context.map().centerEase(d.loc);
        mapillary.setSelectedImage(d.key);
        mapillary.setViewerImage(d.key);
        mapillary.showViewer();
        _clicks.push(d.key);
    }

    function nodeChanged(d) {
        var mapillary = getMapillary();
        if (!mapillary) return;

        var index = _clicks.indexOf(d.key);
        if (index > -1) {
            _clicks.splice(index, 1);
        } else {   // change initiated from the viewer controls..
            var loc = d.apiNavImIm ? [d.apiNavImIm.lon, d.apiNavImIm.lat] : [d.latLon.lon, d.latLon.lat];
            context.map().centerEase(loc);
            mapillary.setSelectedImage(d.key);
        }
    }

    function transform(d) {
        var t = iD.svg.PointTransform(projection)(d);
        if (d.ca) t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
        return t;
    }

    function update() {
        var mapillary = getMapillary(),
            data = (mapillary ? mapillary.images(projection, layer.dimensions()) : []),
            imageKey = mapillary ? mapillary.getSelectedImage() : null;

        var markers = layer.selectAll('.viewfield-group')
            .data(data, function(d) { return d.key; });

        // Enter
        var enter = markers.enter()
            .append('g')
            .attr('class', 'viewfield-group')
            .classed('selected', function(d) { return d.key === imageKey; })
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
