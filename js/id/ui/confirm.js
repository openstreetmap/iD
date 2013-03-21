iD.ui.confirm = function(selection) {
    var modal = iD.ui.modal(selection);

    modal.select('.modal')
        .classed('modal-alert', true);

    var section = modal.select('.content');

    var modalHeader = section.append('div')
        .attr('class', 'modal-section header');

    var description = section.append('div')
        .attr('class', 'modal-section message-text');

    var buttonwrap = section.append('div')
        .attr('class', 'modal-section buttons cf');

    var okbutton = buttonwrap.append('button')
        .attr('class', 'col2 action')
        .on('click.confirm', function() {
            modal.remove();
        })
        .text('Okay');

    return modal;
};
