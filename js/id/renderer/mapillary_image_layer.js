iD.MapillaryImageLayer = function(context) {
    var mapillary = iD.services.mapillary()
            .on('loadedImages.imageLayer', imagesLoaded),
        imageData = rbush(),
        urlImage = 'http://mapillary.com/map/im/',
        urlThumb = 'https://d1cuyjsrcm0gby.cloudfront.net/',
        enable = false,
        currentImage,
        svg, thumbnail;


    function show(image) {
        svg.selectAll('g')
            .classed('selected', function(d) {
                return currentImage && d.key === currentImage.key;
            });

        thumbnail.classed('hidden', false)
            .classed('temp', image !== currentImage);

        thumbnail.selectAll('img')
            .attr('src', urlThumb + image.key + '/thumb-320.jpg');

        thumbnail.selectAll('a')
            .attr('href', urlImage + image.key);
    }

    function hide() {
        currentImage = undefined;

        svg.selectAll('g')
            .classed('selected', false);

        thumbnail.classed('hidden', true);
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
                    loc: sequence.geometry.coordinates[j]
                }]);
            }
        }

        imageData.load(images);
    }

    function render() {
        var images = imageData
                .search(context.map().extent().rectangle())
                .map(function(d) { return d[4]; });

        var g = svg.selectAll('g')
            .data(images, function(d) { return d.key; });

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

        g.attr('transform', transform);

        g.exit()
            .remove();
    }


    function layer(selection) {
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

        thumbnail = context.container().selectAll('.mapillary-image')
            .data([0]);

        var enter = thumbnail.enter().append('div')
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
            .text(t('mapillary_images.view_on_mapillary'));

        if (!enable) {
            hide();
            svg.selectAll('g').remove();
        } else {
            render();
            mapillary.loadImages(context.projection, svg.dimensions());
        }
    }

    layer.enable = function(_) {
        if (!arguments.length) return enable;
        enable = _;
        return layer;
    };

    layer.dimensions = function(_) {
        if (!arguments.length) return svg.dimensions();
        svg.dimensions(_);
        return layer;
    };

    return layer;
};
