export function svgBlocker(projection, context) {

    function blocker(selection) {
        var dimensions = projection.clipExtent()[1];
        var fillClass = context.getDebug('target') ? 'red ' : 'nocolor ';

        var blocker = selection.selectAll('.layer-blocker')
            .data([{id: 'target-nope'}]);

        blocker.enter()
            .append('rect')
            .attr('class', 'layer-blocker target target-nope ' + fillClass)
            .attr('x', 0)
            .attr('y', 0)
            .merge(blocker)
            .attr('width', dimensions[0])
            .attr('height', dimensions[1]);
    }

    blocker.off = function(selection) {
        selection.selectAll('.layer-blocker')
            .remove();
    };

    return blocker;
}
