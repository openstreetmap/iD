export function pointBox(point, context) {
    var rect = context.surfaceRect();
    point = context.projection(point);
    return {
        left: point[0] + rect.left - 30,
        top: point[1] + rect.top - 50,
        width: 60,
        height: 70
     };
}


export function pad(box, padding, context) {
    if (box instanceof Array) {
        var rect = context.surfaceRect();
        box = context.projection(box);
        box = {
            left: box[0] + rect.left,
            top: box[1] + rect.top
        };
    }
    return {
        left: box.left - padding,
        top: box.top - padding,
        width: (box.width || 0) + 2 * padding,
        height: (box.width || 0) + 2 * padding
    };
}


export function icon(name, svgklass) {
    return '<svg class="icon ' + (svgklass || '') + '">' +
         '<use xlink:href="' + name + '"></use></svg>';
 }
