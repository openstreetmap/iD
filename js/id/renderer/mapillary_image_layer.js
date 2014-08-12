iD.MapillaryImageLayer = function (context) {
    var projection,
        gj = {},
        enable = false,
        svg_image;

    function render(selection) {
        console.log("mapillary_image_layer.render", enable);
        svg_image = selection.selectAll('svg')
            .data([render]);

        if (!enable) {
            d3
                .selectAll('.mapillary-image-layer')
                .remove();
            return;
        }
        svg_image.enter()
            .append('svg');

        svg_image.style('display', enable ? 'block' : 'none');

        var paths = svg_image
            .selectAll('path')
            .data([gj]);

        paths
            .enter()
            .append('path')
            .attr('class', 'mapillary-image');
        var imgs = svg_image
            .selectAll('image')
            .data([gj]);
        imgs
            .enter()
            .append('image')
            .attr('class', 'mapillary-image');

        var path = d3.geo.path()
            .projection(projection);

        paths
            .attr('d', path);

        return render.updatePosition();
    }

    render.projection = function (_) {
        if (!arguments.length) return projection;
        projection = _;
        return render;
    };

    render.enable = function (_) {
        if (!arguments.length) return enable;
        enable = _;
        return render;
    };

    render.geojson = function (_) {
        console.log("mapillary_image_layer.geojson", arguments);
        if (!arguments.length) return gj;
        gj = _;
        return render;
    };

    render.dimensions = function (_) {
        if (!arguments.length) return svg_sequences.dimensions();
//        if(!enable) return render()
        svg_image.dimensions(_);
        return render;
    };

    render.updateImageMarker = function (data) {
        console.log('mapillary_image_layer.updateImageMarker', gj, projection);
        var path = d3.geo.path().projection(projection);
        var paths = svg_image
            .selectAll('path')
            .datum(gj)
            .attr('class', 'mapillary-image fa-arrow-circle-up')
            .attr("d", path);
        var mapPath = paths.attr("d");
        var coords = mapPath.split("m")[0].split(",");
        svg_image.selectAll("image")
            .attr("xlink:href", "/css/img/arrow-icon.jpg")
            .attr("width", 48)
            .attr("height", 48)
            .attr("transform", "translate("+coords[0].substr(1)+","+coords[1]+")rotate("+ gj.features[0].properties.ca +")");


//        var path = d3.geo.path()
//            .projection(projection);
//        console.log("path", path);
    };
    render.click = function click() {
        console.log('mapillary_image_layer.clicked', arguments);
        d3.event.stopPropagation();
        d3.event.preventDefault();
        render.updatePosition();
    }


    render.id = 'layer-mapillary-image';

    render.updatePosition = function () {
        console.log("mapillary_image_layer.updatePosition", arguments);
        var coords = context.map().mouseCoordinates();
        d3.json("http://api.mapillary.com/v1/im/close?limit=1&lat=" + coords[1] + "&limit=1&lon=" + coords[0] + "&geojson=true", function (error, data) {
            console.log("Got", data);
            if (data) {
                render.geojson({
                        type: 'FeatureCollection',
                        features: [
                            {
                                type: 'Feature',
                                geometry: {
                                    coordinates: [data[0].lon, data[0].lat],
                                    type: 'Point'
                                },
                                properties: {
                                    key: data[0].key,
                                    ca: data[0].ca
                                }
                            }
                        ]
                    }
                );
                render.updateImageMarker(data);
            } else {
            }
        });
    }

    return render;


};
