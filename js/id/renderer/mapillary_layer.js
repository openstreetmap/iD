iD.MapillaryLayer = function (context) {
    var projection,
        gj = {},
        enable = false,
        svg;

    function render(selection) {
        console.log("mapillary_layer.render", enable);
        svg = selection.selectAll('svg')
            .data([render]);

        if (!enable) {
            d3
                .select("#sidebar")
                .selectAll('#mapillary-inspector')
                .remove();

            d3
                .selectAll('.mapillary-sequence-layer')
                .remove();
            d3
                .selectAll('.mapillary-image-layer')
                .remove();
            return;
        }
        svg.enter()
            .append('svg');

        svg.style('display', enable ? 'block' : 'none');

        var paths = svg
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

        if (typeof gj.features !== 'undefined') {
            svg
                .selectAll('text')
                .remove();

            svg
                .selectAll('path')
                .data(gj.features)
                .enter()
                .append('text')
                .attr('class', 'mapillary')
                .text(function (d) {
                    return d.properties.key || d.properties.name;
                })
                .attr('x', function (d) {
                    var centroid = path.centroid(d);
                    return centroid[0] + 5;
                })
                .attr('y', function (d) {
                    var centroid = path.centroid(d);
                    return centroid[1];
                });
        }

        d3
            .select("#sidebar")
            .selectAll('#mapillary-inspector')
            .remove();
        d3.select("#sidebar")
            .append('div')
            .attr("id", "mapillary-inspector")
            .append('h4')
            .html('mapillary');

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
        console.log("geojson", arguments);
        if (!arguments.length) return gj;
        gj = _;
        return render;
    };

    render.dimensions = function (_) {
        console.log("mapillary.dimensions", arguments);
        if (!arguments.length) return svg.dimensions();
//        if(!enable) return render()
        svg.dimensions(_);
        return render;
    };

    render.click = function click() {
        console.log('clicked', arguments);
        d3.event.stopPropagation();
        d3.event.preventDefault();

        var mapillary_wrapper = d3.select("#sidebar")
            .select('#mapillary-inspector');
        console.log(mapillary_wrapper);

        var coords = context.map().mouseCoordinates();
        d3.json("http://api.mapillary.com/v1/im/close?limit=1&lat="+coords[1]+"&limit=10&lon="+coords[0], function (error, data) {
            console.log("Got", data);
            if(data) {
                mapillary_wrapper.html('<a target="_blank" href="http://mapillary.com/map/im/'+data[0].key+'"><img src="https://d1cuyjsrcm0gby.cloudfront.net/'+data[0].key+'/thumb-320.jpg"></img></a>');
            } else {
                mapillary_wrapper.html("No picture found, try clicking near the Mapillary sequences");
            }
        });
    }


    render.id = 'layer-mapillary';

    render.updatePosition = function () {
        var dimensions = context.map().extent();
        console.log("dimensions", dimensions    );
//        console.log("updatePosition", context.map().pointLocation([0, dimensions[0]]));
        d3.json("http://api.mapillary.com/v1/s/search?min-lat="+dimensions[0][1]+"&max-lat="+dimensions[1][1]+"\&min-lon\="+dimensions[0][0]+"&max-lon="+dimensions[1][0]+"&max-results=100&geojson=true", function (error, data) {
            console.log("Got", data);
            render.geojson(data);
        });
    }

    return render;


};
