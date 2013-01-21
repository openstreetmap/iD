iD.ui.flash = function() {
    var modal = iD.ui.modal();

    modal.select('.modal').classed('modal-alert', true);

    modal.select('.content')
        .classed('modal-section', true)
        .append('div')
        .attr('class', 'description');

    modal.on('click.flash', function() { modal.remove(); });

    setTimeout(function() {
        modal.remove();
        return true;
    }, 1000);

    return modal;
};
