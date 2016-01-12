// Extend d3.selection, get/set the width and height of the first non-null element in the current selection
// WARN: This method does not check the null selection which could cause a error

d3.selection.prototype.dimensions = function (dimensions) {
    if (!arguments.length) {
        var node = this.node();
        return [node.offsetWidth,
                node.offsetHeight];
    }
    return this.attr({width: dimensions[0], height: dimensions[1]});
};
