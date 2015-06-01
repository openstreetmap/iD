iD.MapillarySignsLayer = function (context) {
    var enable = false,
        initiated = false,
        currentImage,
        svg, image_preview_div, request, signs_defs;
    request = d3.json('/css/traffico-release-0.1.5/global-patched.json',
        function (error, data) {
            console.error(arguments);
            if (error) return;
            signs_defs=data;
        });
    function show(image) {
        svg.selectAll('.node')
            .classed('selected', function (d) {
                return currentImage && d.key === currentImage.key;
            });

        image_preview_div.classed('hidden', false)
            .classed('temp', image !== currentImage);

        image_preview_div.selectAll('img')
            .attr('src', 'https://d1cuyjsrcm0gby.cloudfront.net/' + image.key + '/thumb-320.jpg');

        image_preview_div.selectAll('a')
            .attr('href', 'http://mapillary.com/map/im/' + image.key);
    }

    function hide() {
        currentImage = undefined;
        svg.selectAll('.node')
            .classed('selected', false);
        image_preview_div.classed('hidden', true);
    }

    function transform(image) {
        var t = 'translate(' + context.projection(image.loc) + ')';
        return t;
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
            .text(t('mapillary.view_on_mapillary'));

        if (!enable) {
            hide();

            svg.selectAll('.node')
                .remove();

            return;
        }

        svg.selectAll('.node')
            .remove();

        var extent = context.map().extent();

        if (request)
            request.abort();

        request = d3.json('https://a.mapillary.com/v2/search/im/geojson/or?' +
            'or_classes[]=prohibitory_no' +
            '&or_classes[]=other_no&or_package=trafficsign_eu_1.0' +
            '&min_score=2&' +
            'client_id=NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzoxNjQ3MDY4ZTUxY2QzNGI2&min_lat=' +
            extent[0][1] + '&max_lat=' + extent[1][1] + '&min_lon=' +
            extent[0][0] + '&max_lon=' + extent[1][0] + '&max_results=1000&geojson=true',
            function (error, data) {
                if (error) return;
                console.log(data);
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
                    .data(images, function (d) {
                        return d.key;
                    });

                var enter = foreignObjects.enter();

                var body = enter.append('foreignObject')
                    .attr('x', '0')
                    .attr('y', '0')
                    .attr('width', '30px')
                    .attr('height', '30px')
                    .attr('class', 'node')
                    .append('xhtml:body')
                    .html(function (d) {
                        var sign_html = signs_defs[d.signs[0]['type']];
                        return sign_html;
                    });
                foreignObjects.on('click', function (data) {
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
                    .on('mouseover', function (data) {
                        if (!data) {
                            d3.event.preventDefault();
                            return;
                        }
                        show(data);
                    })
                    .on('mouseout', function (data) {
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

                foreignObjects.attr('transform', transform);

                foreignObjects.exit()
                    .remove();
                console.log(images);
                if(!initiated) {
                    initiated = true;
                    context.map().zoomOut();
                }
            });
    }

    render.enable = function (_) {
        if (!arguments.length) return enable;
        enable = _;
        return render;
    };

    render.dimensions = function (_) {
        if (!arguments.length) return svg.dimensions();
        svg.dimensions(_);
        return render;
    };

    return render;
};
