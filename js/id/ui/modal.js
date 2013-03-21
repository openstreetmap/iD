iD.ui.modal = function(selection, blocking) {

    var previous = selection.select('div.modal');
    var animate = previous.empty();

    var keybinding = d3.keybinding('modal')
        .on('⌫', close)
        .on('⎋', close);

    d3.select(document).call(keybinding);

    previous.transition()
        .style('opacity', 0).remove();

    var shaded = selection
        .append('div')
        .attr('class', 'shaded')
        .style('opacity', 0)
        .on('click.remove-modal', function() {
            if (d3.event.target == this && !blocking) d3.select(this).remove();
        });

    var modal = shaded.append('div')
        .attr('class', 'modal fillL col6');

    modal.append('button')
        .attr('class', 'close')
        .on('click', function() {
            if (!blocking) shaded.remove();
        })
        .append('div')
            .attr('class','icon close');

    modal.append('div')
        .attr('class', 'content');

    if (animate) {
        shaded.transition().style('opacity', 1);
    } else {
        shaded.style('opacity', 1);
    }

    function close() {
        shaded.remove();
        keybinding.off();
    }

    return shaded;
};
