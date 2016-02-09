iD.MapillarySignLayer = function(context) {
    var mapillary = iD.services.mapillary(),
        rtree = rbush(),
        enabled = false,
        selectedImage,
        layer;


    function show(image) {
        layer.selectAll('.icon-sign')
            .classed('selected', function(d) {
                return selectedImage && d.key === selectedImage.key;
            });

        mapillary.showThumbnail(context.container(), image);
    }

    function hide() {
        selectedImage = undefined;
        layer.selectAll('.icon-sign')
            .classed('selected', false);

        mapillary.hideThumbnail(context.container());
    }

    function signsLoaded(data) {
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
    }


    function update() {
        var signs = rtree
                .search(context.map().extent().rectangle())
                .map(function(d) { return d[4]; });

        var signGroups = layer.selectAll('.mapillary-sign')
            .data(signs, function(d) { return d.key; });

        // Enter
        var enter = signGroups.enter()
            .append('g')
            .attr('class', 'mapillary-sign')
            .attr('transform', 'translate(-15, -15)')
            .append('foreignObject')
            .attr('class', 'icon-sign')
            .append('xhtml:body')
            .html(mapillary.signHTML);

        enter
            .on('click', function(d) {
                if (d === selectedImage) {
                    hide();
                } else {
                    selectedImage = d;
                    show(d);
                }
            })
            .on('mouseover', show)
            .on('mouseout', function() {
                if (selectedImage) {
                    show(selectedImage);
                } else {
                    hide();
                }
            });

        // Update
        signGroups
            .select('.icon-sign')
            .attr('transform', iD.svg.PointTransform(context.projection));

        signGroups.exit()
            .remove();
    }


    function render(selection) {
        layer = selection.selectAll('svg')
            .data([0]);

        // Enter
        layer.enter()
            .append('svg');

        // Update
        layer
            .style('display', enabled ? 'block' : 'none');

        if (!enabled) {
            hide();
            layer.selectAll('.mapillary-sign')
                .transition()
                .duration(200)
                .style('opacity', 0)
                .remove();
        } else {
            update();
            mapillary.loadSigns(context, context.projection, layer.dimensions());
        }
    }


    render.enable = function(_) {
        if (!arguments.length) return enabled;
        enabled = _;
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
