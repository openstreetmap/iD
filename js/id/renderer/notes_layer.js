iD.NotesLayer = function(context, dispatch) {
    var projection = context.projection,
        dimensions = [1, 1],
        notes = [],
        queue = [],
        enable = true,
        svg;

    function mergeNotes(err, result) {
        if (err) return;
        if (result && result.features) {
            result.features.forEach(function(feature) {
                queue.push(feature.properties.id);
            });
            notes = notes.concat(result.features);
        }
    }

    function render(selection) {

        context.connection().on('loadnote.layer', mergeNotes);

        svg = selection.selectAll('svg')
            .data([render]);

        svg.enter()
            .append('svg');

        // svg.style('display', enable ? 'block' : 'none');
        svg.style('display', 'block');

        var circles = svg
            .selectAll('circle')
            .data(notes);

        circles
            .enter()
            .append('circle')
            .attr('r', 5)
            .attr('class', 'note')
            .on('click', clickNote);

        circles
            .attr('transform', function(d) {
                var p = projection(d.geometry.coordinates);
                return 'translate(' + p[0] + ',' + p[1] + ')';
            });
    }

    function clickNote(d) {
        context.enter(iD.modes.Note(context, d));
    }

    function redraw() {
        context.connection().loadNotes(projection, dimensions);
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

    render.id = 'layer-notes';

    return render;
};
