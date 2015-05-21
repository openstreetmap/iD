iD.MapillarySignsLayer = function (context) {
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

        div = context.container().selectAll('.mapillary-signs')
            .data([0]);

        var enter = div.enter().append('div')
            .attr('class', 'mapillary-signs');

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

        request = d3.json('https://a.mapillary.com/v2/search/im/geojson/or?' +
            'or_classes[]=prohibitory_no' +
            '&or_classes[]=other_no&or_package=trafficsign_eu_1.0' +
            '&min_score=2&' +
            'client_id=NzNRM2otQkR2SHJzaXJmNmdQWVQ0dzoxNjQ3MDY4ZTUxY2QzNGI2&min_lat=' +
            extent[0][1] + '&max_lat=' + extent[1][1] + '&min_lon=' +
            extent[0][0] + '&max_lon=' + extent[1][0] + '&max_results=100&geojson=true',
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

                var g = svg.selectAll('foreignObject')
                    .data(images, function(d) { return d.key; });

                var enter = g.enter();

                var body = enter.append('foreignObject')
                    .attr('x', '0')
                    .attr('y', '0')
                    .attr('class', 'node')
                    .attr('width', '20')
                    .attr('height', '20')
                    .append('xhtml:body')
                    .html('<span class="t"><i class="t-circle-bg t-c-white"></i><i class="t-circle-o t-c-red"></i><i class="t-truck t-c-black"></i><i class="t-circle-bar-rounded t-c-red" style="-webkit-transform:rotate(45deg);-moz-transform:rotate(45deg);transform:rotate(45deg)"></i></span>');
                g.attr('transform', transform);

                g.exit()
                    .remove();
                console.log(images);
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
