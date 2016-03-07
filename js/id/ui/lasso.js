iD.ui.Lasso = function(context) {

    var group, path,
        polygon, p;

    lasso.coordinates = [];

    function lasso(selection) {

        context.container().classed('lasso', true);

        group = selection.append('g')
            .attr('class', 'lasso hide');

        polygon = group.append('path')
            .attr('class', 'lasso-box');

        group.call(iD.ui.Toggle(true));

    }

    // top-left
    function topLeft(d) {
        return path = (path ? (path + ' L ') : 'M ') + d[0] + ' ' + d[1];
    }

    function draw() {
        if (polygon) {
            polygon.data([p])
                .attr('d', topLeft);
        }
    }

    lasso.getBounds = function () {
        var x = lasso.coordinates.map(function(i) {return i[0];});
        var y = lasso.coordinates.map(function(i) {return i[1];});
        return [[Math.min.apply(null, x), Math.min.apply(null, y)],
                [Math.max.apply(null, x), Math.max.apply(null, y)]];
    };

    lasso.p = function(_) {
        if (!arguments.length) return p;
        p = _;
        lasso.coordinates.push(p);
        draw();
        return lasso;
    };


    lasso.close = function() {

        polygon.data([p])
            .attr('d', path + ' Z');

        if (group) {
            group.call(iD.ui.Toggle(false, function() {
                d3.select(this).remove();
            }));
        }
        context.container().classed('lasso', false);
    };

    return lasso;
};
