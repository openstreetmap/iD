iD.flash = function() {
    var modal = iD.modal();

    modal.select('.modal').classed('modal-alert', true);

    modal.select('.content')
        .classed('modal-section', true)
        .append('div')
        .attr('class', 'description');

    modal.on('click.flash', function() { modal.remove(); });

    d3.timer(function() {
        modal.remove();
        return true;
    }, 1000);

    return modal;
};
