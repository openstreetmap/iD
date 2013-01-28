iD.ui.modal = function(blocking) {

    var animate = d3.select('div.modal').empty();

    var keybinding = d3.keybinding('modal')
        .on('⌫', close)
        .on('⎋', close);

    d3.select(document).call(keybinding);

    d3.select('div.modal').transition()
        .style('opacity', 0).remove();

    var shaded = d3.select(document.body)
        .append('div')
        .attr('class', 'shaded')
        .style('opacity', 0)
        .on('click.remove-modal', function() {
            if (d3.event.target == this && !blocking) d3.select(this).remove();
        });

    var modal = shaded.append('div')
        .attr('class', 'modal');

    modal.append('button')
        .attr('class', 'icon remove close-modal')
        .on('click', function() {
            if (!blocking) shaded.remove();
        });

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
