import type { Vec2 } from '../geo/vector';

function refresh(selection: d3.Selection, node: HTMLElement): Vec2 {
    var cr = node.getBoundingClientRect();
    const prop: Vec2 = [cr.width, cr.height];
    selection.property('__dimensions__', prop);
    return prop;
}

export function utilGetDimensions(selection: d3.Selection, force?: boolean): Vec2 {
    if (!selection || selection.empty()) {
        return [0, 0];
    }
    var node = selection.node(),
        cached = selection.property('__dimensions__');
    return (!cached || force) ? refresh(selection, node) : cached;
}


export function utilSetDimensions(selection: d3.Selection, dimensions: Vec2 | null) {
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
