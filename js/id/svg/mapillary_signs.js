iD.svg.MapillarySigns = function(projection, context, dispatch) {
    var debouncedRedraw = _.debounce(function () { dispatch.change(); }, 1000),
        minZoom = 12,
        layer = d3.select(null),
        _mapillary;


    function init() {
        if (iD.svg.MapillarySigns.initialized) return;  // run once
        iD.svg.MapillarySigns.enabled = false;
        iD.svg.MapillarySigns.initialized = true;
    }

    function getMapillary() {
        if (iD.services.mapillary && !_mapillary) {
            _mapillary = iD.services.mapillary().on('loadedSigns', debouncedRedraw);
        } else if (!iD.services.mapillary && _mapillary) {
            _mapillary = null;
        }
        return _mapillary;
    }

    function showThumbnail(image) {
        var mapillary = getMapillary();
        if (!mapillary) return;

        var thumb = mapillary.selectedThumbnail(),
            posX = projection(image.loc)[0],
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

        var mapillary = getMapillary();
        if (mapillary) {
            mapillary.hideThumbnail();
        }
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

    function update() {
        var mapillary = getMapillary(),
            data = (mapillary ? mapillary.signs(projection, layer.dimensions()) : []);

        var signs = layer.selectAll('.icon-sign')
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
                var mapillary = getMapillary();
                if (!mapillary) return;
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
                var mapillary = getMapillary();
                if (!mapillary) return;
                var thumb = mapillary.selectedThumbnail();
                if (thumb) {
                    showThumbnail(thumb);
                } else {
                    hideThumbnail();
                }
            });

        // Exit
        signs.exit()
            .remove();

        // Update
        signs
            .attr('transform', iD.svg.PointTransform(projection));
    }

    function drawSigns(selection) {
        var enabled = iD.svg.MapillarySigns.enabled,
            mapillary = getMapillary();

        layer = selection.selectAll('.layer-mapillary-signs')
            .data(mapillary ? [0] : []);

        layer.enter()
            .append('g')
            .attr('class', 'layer-mapillary-signs')
            .style('display', enabled ? 'block' : 'none')
            .attr('transform', 'translate(-16, -16)');  // center signs on loc

        layer.exit()
            .remove();

        if (enabled) {
            if (mapillary && ~~context.map().zoom() >= minZoom) {
                editOn();
                update();
                mapillary.loadSigns(context, projection, layer.dimensions());
            } else {
                editOff();
            }
        }
    }

    drawSigns.enabled = function(_) {
        if (!arguments.length) return iD.svg.MapillarySigns.enabled;
        iD.svg.MapillarySigns.enabled = _;
        if (iD.svg.MapillarySigns.enabled) {
            showLayer();
        } else {
            hideLayer();
        }
        dispatch.change();
        return this;
    };

    drawSigns.supported = function() {
        var mapillary = getMapillary();
        return (mapillary && mapillary.signsSupported());
    };

    drawSigns.dimensions = function(_) {
        if (!arguments.length) return layer.dimensions();
        layer.dimensions(_);
        return this;
    };

    init();
    return drawSigns;
};
