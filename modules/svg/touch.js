export function svgTouch() {

    function drawTouch(selection) {
        selection.selectAll('.layer-touch')
            .data(['areas', 'lines', 'points', 'turns', 'notes'])
            .enter()
            .append('g')
            .attr('class', function(d) { return 'layer-touch ' + d; });
    }

    return drawTouch;
}
