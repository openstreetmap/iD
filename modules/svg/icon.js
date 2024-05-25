export function svgIcon(name, svgklass, useklass) {
    return function drawIcon(selection) {
        selection.selectAll('svg.icon' + (svgklass ? '.' + svgklass.split(' ')[0] : ''))
            .data([0])
            .enter()
            .append('svg')
            .attr('class', 'icon ' + (svgklass || ''))
            .append('use')
            .attr('xlink:href', name)
            .attr('class', useklass);
    };
}

/** @param {string} url */
export function svgIconExternal(url) {
    /** @param {import("d3-selection").Selection} selection */
    return function drawIcon(selection) {
        selection.selectAll('img.icon')
            .data([0])
            .enter()
            .append('img')
            .attr('class', 'icon')
            .attr('src', url);
    };
}
