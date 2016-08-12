function refresh(target, node) {
    var cr = node.getBoundingClientRect();
    var prop = [cr.width, cr.height];
    target.property('__dimensions__', prop);
    return prop;
}

export function getDimensions (target) {
    if (!target) return [0, 0];
    var node = target.node();
    return target.property('__dimensions__') || refresh(target, node);
}

export function setDimensions (target, dimensions) {
    var node = target.node();
    if (dimensions === null) {
        if (!node) return [0,0];
        return refresh(target, node);
    }
    return target
        .property('__dimensions__', [dimensions[0], dimensions[1]])
        .attr('width', dimensions[0])
        .attr('height', dimensions[1])
}
