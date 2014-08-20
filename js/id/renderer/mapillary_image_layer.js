iD.MapillaryImageLayer = function (context) {
    var projection,
        gj = {},
        enable = false,
        dimension,
        svg_image;

    function render(selection) {
        svg_image = selection.selectAll('svg')
            .data([render]);

        if (!enable) {
            selection
                .selectAll('.mapillary-image-layer')
                .remove();
            d3
                .selectAll('.inspector-wrap')
                .classed('part65', false);
            d3
                .selectAll('.panewrap')
                .classed('part65', false);
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

        d3
            .selectAll('.inspector-wrap')
            .classed('part65', true);
        d3
            .selectAll('.panewrap')
            .classed('part65', true);
        d3
            .select('#mapillary-inspector')
            .remove();
        d3.select('#sidebar')
            .append('div')
            .attr('id', 'mapillary-inspector')
            .append('h4')
            .html(t('mapillary.no_image_found'));


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
        if (!arguments.length) return gj;
        gj = _;
        return render;
    };

    render.dimensions = function (_) {
        if (!arguments.length) return svg_image.dimensions();
        dimension = _;
        svg_image.dimensions(_);
        return render;
    };

    render.updateImageMarker = function () {
        render.dimensions(dimension);
        var path = d3.geo.path().projection(projection);
        var paths = svg_image
            .selectAll('path')
            .datum(gj)
            .attr('class', 'mapillary-image fa-arrow-circle-up')
            .attr('d', path);
        var mapPath = paths.attr('d');
        var coords = mapPath.split('m')[0].split(",");
        var size = 40;
        var x = coords[0].substr(1);
        var y = coords[1];
        svg_image.selectAll('image')
            .attr('xlink:href', 'img/arrow-icon.png')
            .attr('width', size)
            .attr('height', size)
            .attr('transform', 'translate(' + ( x - size / 2) + ',' + ( y - size / 2) + ')rotate(' + gj.features[0].properties.ca + ',' + size / 2 + ',' + size / 2 + ')');

        //update image
        var mapillary_wrapper = d3.select('#sidebar')
            .select('#mapillary-inspector');

        mapillary_wrapper.html('<a target="_blank" href="https://mapillary.com/map/im/' + gj.features[0].properties.key + '"><img src="https://d1cuyjsrcm0gby.cloudfront.net/' + gj.features[0].properties.key + '/thumb-320.jpg"></img><div class="link"><span>'+t('mapillary.view_on_mapillary')+'</span></div></a>');

    };

    render.noImageFound = function() {
        var mapillary_wrapper = d3.select('#sidebar')
            .select('#mapillary-inspector');

        mapillary_wrapper.html('<h4>'+t('mapillary.no_image_found')+'</h4>');

    };
    render.click = function click() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        render.updatePosition();
    };


    render.id = 'layer-mapillary-image';

    render.updatePosition = function () {
        var coords = context.map().mouseCoordinates();
        d3.json('https://api.mapillary.com/v1/im/close?limit=1&lat=' + coords[1] + '&limit=1&lon=' + coords[0] + '&geojson=true', function (error, data) {
            if (data && data.length > 0) {
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
                render.noImageFound();
            }
        });
    };

    return render;


};
