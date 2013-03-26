iD.ui.modal = function(selection, blocking) {

    var previous = selection.select('div.modal');
    var animate = previous.empty();

    var keybinding = d3.keybinding('modal')
        .on('⌫', close)
        .on('⎋', close);

    d3.select(document).call(keybinding);

    previous.transition()
        .duration(200)
        .style('opacity', 0)
        .remove();

    var shaded = selection
        .append('div')
        .attr('class', 'shaded')
        .style('opacity', 0);

    var modal = shaded.append('div')
        .attr('class', 'modal fillL col6');

        shaded.on('click.remove-modal', function() {
            if (d3.event.target == this && !blocking) {
                shaded
                    .transition()
                    .duration(200)
                    .style('opacity',0)
                    .remove();
                modal
                    .transition()
                    .duration(200)
                    .style('top','0px');
            }
        });

    modal.append('button')
        .attr('class', 'close')
        .on('click', function() {
            if (!blocking) {
                shaded
                    .transition()
                    .duration(200)
                    .style('opacity',0)
                    .remove();
                modal
                    .transition()
                    .duration(200)
                    .style('top','0px');
            }
        })
        .append('div')
            .attr('class','icon close');

    modal.append('div')
        .attr('class', 'content');

    if (animate) {
        shaded.transition().style('opacity', 1);
        modal
            .style('top','0px')
            .transition()
            .duration(200)
            .style('top','40px');
    } else {
        shaded.style('opacity', 1);
    }

    function close() {
        shaded
            .transition()
            .duration(200)
            .style('opacity',0)
            .remove();
        modal
            .transition()
            .duration(200)
            .style('top','0px');
        keybinding.off();
    }

    return shaded;
};
