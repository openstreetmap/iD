d3.selection.prototype.dimensions = function (dimensions) {
    if (!arguments.length) {
        var node = this.node();
        return [node.offsetWidth,
                node.offsetHeight];
    }
    return this.attr({width: dimensions[0], height: dimensions[1]});
};
