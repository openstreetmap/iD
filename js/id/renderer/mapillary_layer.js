iD.MapillaryLayer = function (context) {
    var enable = false,
        currentImage,
        svg, div, request;

    function show(image) {
        svg.selectAll('g')
            .classed('selected', function(d) {
                return currentImage && d.key === currentImage.key;
            });

        div.classed('hidden', false)
            .classed('temp', image !== currentImage);

        div.selectAll('img')
            .attr('src', 'https://d1cuyjsrcm0gby.cloudfront.net/' + image.key + '/thumb-320.jpg');

        div.selectAll('a')
            .attr('href', 'http://mapillary.com/map/im/' + image.key);
    }

    function hide() {
        currentImage = undefined;

        svg.selectAll('g')
            .classed('selected', false);

        div.classed('hidden', true);
    }

    function transform(image) {
        var t = 'translate(' + context.projection(image.loc) + ')';
        if (image.ca) t += 'rotate(' + image.ca + ',0,0)';
        return t;
    }

    function render(selection) {
        svg = selection.selectAll('svg')
            .data([0]);

        svg.enter().append('svg')
            .on('click', function() {
                var image = d3.event.target.__data__;
                if (currentImage === image) {
                    hide();
                } else {
                    currentImage = image;
                    show(image);
                }
            })
            .on('mouseover', function() {
                show(d3.event.target.__data__);
            })
            .on('mouseout', function() {
                if (currentImage) {
                    show(currentImage);
                } else {
                    hide();
                }
            });

        svg.style('display', enable ? 'block' : 'none');

        div = context.container().selectAll('.mapillary-image')
            .data([0]);

        var enter = div.enter().append('div')
            .attr('class', 'mapillary-image');

        enter.append('button')
            .on('click', hide)
            .append('div')
            .attr('class', 'icon close');

        enter.append('img');

        var link = enter.append('a')
            .attr('class', 'link')
            .attr('target', '_blank');

        link.append('span')
            .attr('class', 'icon icon-pre-text out-link');

        link.append('span')
            .text(t('mapillary.view_on_mapillary'));

        if (!enable) {
            hide();

            svg.selectAll('g')
                .remove();

            return;
        }

        // Update existing images while waiting for new ones to load.
        svg.selectAll('g')
            .attr('transform', transform);

        var extent = context.map().extent();

        if (request)
            request.abort();

        request = d3.json('https://a.mapillary.com/v2/search/s/geojson?client_id=NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzoxNjQ3MDY4ZTUxY2QzNGI2&min_lat=' +
            extent[0][1] + '&max_lat=' + extent[1][1] + '&min_lon=' +
            extent[0][0] + '&max_lon=' + extent[1][0] + '&max_results=100&geojson=true',
            function (error, data) {
                if (error) return;

                var images = [];

                for (var i = 0; i < data.features.length; i++) {
                    var sequence = data.features[i];
                    for (var j = 0; j < sequence.geometry.coordinates.length; j++) {
                        images.push({
                            key: sequence.properties.keys[j],
                            ca: sequence.properties.cas[j],
                            loc: sequence.geometry.coordinates[j]
                        });
                        if (images.length >= 1000) break;
                    }
                }

                var g = svg.selectAll('g')
                    .data(images, function(d) { return d.key; });

                var enter = g.enter().append('g')
                    .attr('class', 'image');

                enter.append('path')
                    .attr('d', 'M 0,-5 l 0,-20 l -5,30 l 10,0 l -5,-30');

                enter.append('circle')
                    .attr('dx', '0')
                    .attr('dy', '0')
                    .attr('r', '8');

                g.attr('transform', transform);

                g.exit()
                    .remove();
            });
    }

    render.enable = function(_) {
        if (!arguments.length) return enable;
        enable = _;
        return render;
    };

    render.dimensions = function(_) {
        if (!arguments.length) return svg.dimensions();
        svg.dimensions(_);
        return render;
    };

    return render;
};
