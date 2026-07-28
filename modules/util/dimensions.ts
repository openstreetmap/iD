import type { Vec2 } from '../geo/vector';

function refresh<T extends Element>(selection: d3.Selection<T>, node: T): Vec2 {
    const cr = node.getBoundingClientRect();
    const prop: Vec2 = [cr.width, cr.height];
    selection.property('__dimensions__', prop);
    return prop;
}

export function utilGetDimensions<T extends Element>(selection: d3.Selection<T>, force?: boolean): Vec2 {
    if (!selection || selection.empty()) {
        return [0, 0];
    }
    const node = selection.node(),
        cached = selection.property('__dimensions__');
    return (!cached || force) ? refresh(selection, node!) : cached;
}


export function utilSetDimensions<T extends Element>(selection: d3.Selection<T>, dimensions: Vec2 | null): d3.Selection<T> {
    if (!selection || selection.empty()) {
        return selection;
    }
    const node = selection.node();
    if (dimensions === null) {
        refresh(selection, node!);
        return selection;
    }
    return selection
        .property('__dimensions__', [dimensions[0], dimensions[1]])
        .attr('width', dimensions[0])
        .attr('height', dimensions[1]);
}
