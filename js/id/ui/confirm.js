iD.ui.confirm = function(selection) {
    var modal = iD.ui.modal(selection);

    modal.select('.modal')
        .classed('modal-alert', true);

    var section = modal.select('.content')
        .attr('class', 'modal-section fillD');

    var description = section.append('div')
        .attr('class', 'description');

    var buttonwrap = section.append('div')
        .attr('class', 'buttons cf');

    var okbutton = buttonwrap.append('button')
        .attr('class', 'col2 action centered')
        .on('click.confirm', function() {
            modal.remove();
        });

    okbutton.append('span')
        .attr('class', 'icon apply icon-pre-text');

    okbutton.append('span')
        .attr('class', 'label')
        .text('Okay');

    return modal;
};
