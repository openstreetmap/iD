export function svgTouch() {

    function drawTouch(selection: d3.Selection) {
        selection.selectAll('.layer-touch')
            .data(['areas', 'lines', 'points', 'turns', 'markers'])
            .enter()
            .append('g')
            .attr('class', function(d) { return 'layer-touch ' + d; });
    }

    return drawTouch;
}
