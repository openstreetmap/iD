iD.ui.Lasso = function(context) {

    var box, group,
        a = [0, 0],
        b = [0, 0];

    function lasso(selection) {

        context.container().classed('lasso', true);

        group = selection.append('g')
            .attr('class', 'lasso hide');

        box = group.append('rect')
            .attr('class', 'lasso-box');

        group.call(iD.ui.Toggle(true));

    }

    // top-left
    function topLeft(d) {
        return 'translate(' + Math.min(d[0][0], d[1][0]) + ',' + Math.min(d[0][1], d[1][1]) + ')';
    }

    function width(d) { return Math.abs(d[0][0] - d[1][0]); }
    function height(d) { return Math.abs(d[0][1] - d[1][1]); }

    function draw() {
        if (box) {
            box.data([[a, b]])
                .attr('transform', topLeft)
                .attr('width', width)
                .attr('height', height);
        }
    }

    lasso.a = function(_) {
        if (!arguments.length) return a;
        a = _;
        draw();
        return lasso;
    };

    lasso.b = function(_) {
        if (!arguments.length) return b;
        b = _;
        draw();
        return lasso;
    };

    lasso.close = function() {
        if (group) {
            group.call(iD.ui.Toggle(false, function() {
                d3.select(this).remove();
            }));
        }
        context.container().classed('lasso', false);
    };

    return lasso;
};
