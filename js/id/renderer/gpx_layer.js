iD.GpxLayer = function(context, dispatch) {
    var projection,
        gj = {},
        enable = true,
        svg;

    function render(selection) {
        svg = selection.selectAll('svg')
            .data([render]);

        svg.enter()
            .append('svg');

        svg.style('display', enable ? 'block' : 'none');

        var paths = svg
            .selectAll('path')
            .data([gj]);

        paths
            .enter()
            .append('path')
            .attr('class', 'gpx');

        paths
            .attr('d', d3.geo.path().projection(projection));
        
        if (typeof gj.features !== 'undefined') {
            svg
                .selectAll('text')
                .remove();

            svg
                .selectAll('path')
                .data(gj.features)
                .enter()            
                .append('text')
                .attr('class', 'gpx')
                .text(function(d) {
                    return d.properties.name;
                })
                .attr('x', function(d) {
                    var centroid = d3.geo.path().projection(projection)
                        .centroid(d);
                    return centroid[0] + 5; 
                })
                .attr('y', function(d) {
                    var centroid = d3.geo.path().projection(projection)
                        .centroid(d);
                    return centroid[1]; 
                });
        }
    }

    function toDom(x) {
        return (new DOMParser()).parseFromString(x, 'text/xml');
    }

    render.projection = function(_) {
        if (!arguments.length) return projection;
        projection = _;
        return render;
    };

    render.enable = function(_) {
        if (!arguments.length) return enable;
        enable = _;
        return render;
    };

    render.geojson = function(_) {
        if (!arguments.length) return gj;
        gj = _;
        return render;
    };

    render.dimensions = function(_) {
        if (!arguments.length) return svg.dimensions();
        svg.dimensions(_);
        return render;
    };

    render.id = 'layer-gpx';

    function over() {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        d3.event.dataTransfer.dropEffect = 'copy';
    }

    d3.select('body')
        .attr('dropzone', 'copy')
        .on('drop.localgpx', function() {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            if (!iD.detect().filedrop) return;
            var f = d3.event.dataTransfer.files[0],
                reader = new FileReader();

            reader.onload = function(e) {
                render.geojson(toGeoJSON.gpx(toDom(e.target.result)));
                dispatch.change();
                context.map().pan([0, 0]);
            };

            reader.readAsText(f);
        })
        .on('dragenter.localgpx', over)
        .on('dragexit.localgpx', over)
        .on('dragover.localgpx', over);

    return render;
};
