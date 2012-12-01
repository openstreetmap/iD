d3.selection.prototype.size = function (size) {
    if (!arguments.length) {
        var node = this.node();
        return [node.offsetWidth,
                node.offsetHeight];
    }
    return this.attr({width: size[0], height: size[1]});
};
