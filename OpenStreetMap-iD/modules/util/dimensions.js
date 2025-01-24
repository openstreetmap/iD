function refresh(selection, node) {
    var cr = node.getBoundingClientRect();
    var prop = [cr.width, cr.height];
    selection.property('__dimensions__', prop);
    return prop;
}

export function utilGetDimensions(selection, force) {
    if (!selection || selection.empty()) {
        return [0, 0];
    }
    var node = selection.node(),
        cached = selection.property('__dimensions__');
    return (!cached || force) ? refresh(selection, node) : cached;
}


export function utilSetDimensions(selection, dimensions) {
    if (!selection || selection.empty()) {
        return selection;
    }
    var node = selection.node();
    if (dimensions === null) {
        refresh(selection, node);
        return selection;
    }
    return selection
        .property('__dimensions__', [dimensions[0], dimensions[1]])
        .attr('width', dimensions[0])
        .attr('height', dimensions[1]);
}
