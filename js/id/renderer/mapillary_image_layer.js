iD.MapillaryImageLayer = function(context) {
    var mapillary = iD.services.mapillary(),
        rtree = rbush(),
        enabled = false,
        selectedImage,
        layer;


    function show(image) {
        layer.selectAll('g')
            .classed('selected', function(d) {
                return selectedImage && d.key === selectedImage.key;
            });

        mapillary.showThumbnail(context.container(), image);
    }

    function hide() {
        selectedImage = undefined;
        layer.selectAll('g')
            .classed('selected', false);

        mapillary.hideThumbnail(context.container());
    }

    function transform(d) {
        var t = iD.svg.PointTransform(context.projection)(d);
        if (d.ca) t += ' rotate(' + Math.floor(d.ca) + ',0,0)';
        return t;
    }

    function imagesLoaded(data) {
        var images = [],
            sequence, loc;

        for (var i = 0; i < data.features.length; i++) {
            sequence = data.features[i];
            for (var j = 0; j < sequence.geometry.coordinates.length; j++) {
                loc = sequence.geometry.coordinates[j];
                images.push([loc[0], loc[1], loc[0], loc[1], {
                    key: sequence.properties.keys[j],
                    ca: sequence.properties.cas[j],
                    loc: loc
                }]);
            }
        }

        rtree.load(images);
    }

    function update() {
        var images = rtree
                .search(context.map().extent().rectangle())
                .map(function(d) { return d[4]; });

        var g = layer.selectAll('g')
            .data(images, function(d) { return d.key; });

        // Enter
        var enter = g.enter().append('g')
            .attr('class', 'image');

        enter.append('path')
            .attr('class', 'viewfield')
            .attr('transform', 'scale(1.5,1.5),translate(-8, -13)')
            .attr('d', 'M 6,9 C 8,8.4 8,8.4 10,9 L 16,-2 C 12,-5 4,-5 0,-2 z');

        enter.append('circle')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('r', '6');

        // Update
        g.attr('transform', transform);

        g.exit()
            .remove();
    }


    function render(selection) {
        layer = selection.selectAll('svg')
            .data([0]);

        // Enter
        layer.enter()
            .append('svg')
            .on('click', function() {
                var image = d3.event.target.__data__;
                if (selectedImage === image) {
                    hide();
                } else {
                    selectedImage = image;
                    show(image);
                }
            })
            .on('mouseover', function() {
                show(d3.event.target.__data__);
            })
            .on('mouseout', function() {
                if (selectedImage) {
                    show(selectedImage);
                } else {
                    hide();
                }
            });


        // Update
        layer
            .style('display', enabled ? 'block' : 'none');

        if (!enabled) {
            hide();
            layer.selectAll('g')
                .transition()
                .duration(200)
                .style('opacity', 0)
                .remove();
        } else {
            update();
            mapillary.loadImages(context.projection, layer.dimensions());
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
        .on('loadedImages', imagesLoaded);

    return render;
};
