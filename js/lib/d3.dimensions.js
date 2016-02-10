d3.selection.prototype.dimensions = function (dimensions) {
    if (!arguments.length) {
        var node = this.node();
        if (!node) return;

        var cr = node.getBoundingClientRect();
        return [cr.width, cr.height];
    }
    return this.attr({width: dimensions[0], height: dimensions[1]});
};
