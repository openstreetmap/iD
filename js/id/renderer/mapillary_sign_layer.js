iD.MapillarySignLayer = function(context) {
    var roundedProjection = iD.svg.RoundProjection(context.projection),
        urlSearch = 'https://a.mapillary.com/v2/search/im/geojson/or',
        urlImage = 'http://mapillary.com/map/im/',
        urlThumb = 'https://d1cuyjsrcm0gby.cloudfront.net/',
        clientId = 'NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzoxNjQ3MDY4ZTUxY2QzNGI2',
        enable = false,
        initiated = false,
        currentImage,
        svg, image_preview_div, request, signs_defs;

    request = d3.json('css/traffico-release-0.1.5/global-patched.json', function(error, data) {
        if (error) return;
        signs_defs = data;
    });

    function show(image) {
        svg.selectAll('.icon-sign')
            .classed('selected', function(d) {
                return currentImage && d.key === currentImage.key;
            });

        image_preview_div.classed('hidden', false)
            .classed('temp', image !== currentImage);

        image_preview_div.selectAll('img')
            .attr('src', urlThumb + image.key + '/thumb-320.jpg');

        image_preview_div.selectAll('a')
            .attr('href', urlImage + image.key);
    }

    function hide() {
        currentImage = undefined;
        svg.selectAll('.icon-sign')
            .classed('selected', false);
        image_preview_div.classed('hidden', true);
    }

    function render(selection) {
        svg = selection.selectAll('svg')
            .data([0]);

        svg.enter().append('svg');

        svg.style('display', enable ? 'block' : 'none');

        image_preview_div = context.container().selectAll('.mapillary-image')
            .data([0]);

        var enter = image_preview_div.enter().append('div')
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
            .text(t('mapillary_signs.view_on_mapillary'));

        if (!enable) {
            hide();

            svg.selectAll('.icon-sign')
                .remove();

            return;
        }

        // hack
        svg.selectAll('.icon-sign')
            .remove();

        var extent = context.map().extent();

        if (request)
            request.abort();

        request = d3.json(urlSearch + '?client_id=' + clientId + '&min_lat=' +
            extent[0][1] + '&max_lat=' + extent[1][1] + '&min_lon=' +
            extent[0][0] + '&max_lon=' + extent[1][0] + '&limit=100&geojson=true',
            function(error, data) {
                if (error) return;
                var images = [];

                for (var i = 0; i < data.features.length; i++) {
                    var trafficsign = data.features[i];
                    images.push({
                        key: trafficsign.properties.key,
                        loc: trafficsign.geometry.coordinates,
                        signs: trafficsign.properties.rects
                    });
                    if (images.length >= 1000) break;
                }

                var foreignObjects = svg.selectAll('foreignObject')
                    .data(images, function(d) { return d.key; });

                var enter = foreignObjects.enter();

                enter.append('foreignObject')
                    .attr('class', 'icon-sign')
                    .append('xhtml:body')
                    .html(function(d) {
                        var sign_html = signs_defs[d.signs[0].type];
                        return sign_html;
                    });

                foreignObjects
                    .on('click', function(data) {
                        if (!data) {
                            d3.event.preventDefault();
                            return;
                        }
                        var image = data;
                        if (currentImage === image) {
                            hide();
                        } else {
                            currentImage = image;
                            show(image);
                        }
                    })
                    .on('mouseover', function(data) {
                        if (!data) {
                            d3.event.preventDefault();
                            return;
                        }
                        show(data);
                    })
                    .on('mouseout', function(data) {
                        if (!data) {
                            d3.event.preventDefault();
                            return;
                        }
                        if (currentImage) {
                            show(currentImage);
                        } else {
                            hide();
                        }
                    });

                foreignObjects
                    .attr('transform', iD.svg.PointTransform(roundedProjection));

                foreignObjects.exit()
                    .remove();

                if(!initiated) {
                    initiated = true;
                }
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
