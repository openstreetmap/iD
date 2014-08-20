iD.MapillarySequencesLayer = function (context) {
    var projection,
        gj = {},
        enable = false,
        dimension,
        svg_sequences;

    function render(selection) {
        svg_sequences = selection.selectAll('svg')
            .data([render]);

        if (!enable) {
            d3
                .select("#sidebar")
                .selectAll('#mapillary-inspector')
                .remove();
            selection
                .remove();
            return;
        }
        svg_sequences.enter()
            .append('svg');

        svg_sequences.style('display', enable ? 'block' : 'none');

        var paths = svg_sequences
            .selectAll('path')
            .data([gj]);

        paths
            .enter()
            .append('path')
            .attr('class', 'mapillary-sequence');

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
        if (!arguments.length) return gj;
        gj = _;
        return render;
    };

    render.dimensions = function (_) {
        if (!arguments.length) return svg_sequences.dimensions();
        dimension = _;
        svg_sequences.dimensions(_);
        return render;
    };

    render.updateImageMarker = function (data) {
        render.dimensions(dimension);
        var paths = svg_sequences
            .selectAll('path')
            .data([gj]);

        paths
            .enter()
            .append('path')
            .attr('class', 'mapillary-sequence');

        var path = d3.geo.path()
            .projection(projection);

        paths
            .attr('d', path);
    };
    render.click = function click() {
        d3.event.stopPropagation();
        d3.event.preventDefault();


    }


    render.id = 'layer-mapillary';

    render.updatePosition = function () {
        var extent = context.map().extent();

        d3.json("https://api.mapillary.com/v1/s/search?min-lat=" + extent[0][1] + "&max-lat=" + extent[1][1] + "\&min-lon\=" + extent[0][0] + "&max-lon=" + extent[1][0] + "&max-results=100&geojson=true", function (error, data) {
            render.geojson(data);
            render.updateImageMarker(data);
        });
    }

    return render;


};
