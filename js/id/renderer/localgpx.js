iD.LocalGpx = function(context) {
    var tileSize = 256,
        projection,
        gj = {},
        enable = true,
        size = [0, 0],
        transformProp = iD.util.prefixCSSProperty('Transform'),
        path = d3.geo.path().projection(projection),
        source = d3.functor('');

    function render(selection) {

        path.projection(projection);

        var surf = selection.selectAll('svg')
            .data(enable ? [gj] : []);

        surf.exit().remove();

        surf.enter()
            .append('svg')
            .style('position', 'absolute');

        var paths = surf
            .selectAll('path')
            .data(function(d) { return [d]; });

        paths
            .enter()
            .append('path')
            .attr('class', 'gpx');

        paths
            .attr('d', path);
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

    render.size = function(_) {
        if (!arguments.length) return size;
        size = _;
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
                context.redraw();
                context.map().pan([0, 0]);
            };

            reader.readAsText(f);
        })
        .on('dragenter.localgpx', over)
        .on('dragexit.localgpx', over)
        .on('dragover.localgpx', over);

    return render;
};
