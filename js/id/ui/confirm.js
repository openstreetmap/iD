iD.ui.confirm = function(selection) {
    var modal = iD.ui.modal(selection);

    modal.select('.modal')
        .classed('modal-alert', true);

    var section = modal.select('.content');

    section.append('div')
        .attr('class', 'modal-section header');

    section.append('div')
        .attr('class', 'modal-section message-text');

    var buttons = section.append('div')
        .attr('class', 'modal-section buttons cf');

    modal.okButton = function() {
        buttons
            .append('button')
            .attr('class', 'action col4')
            .on('click.confirm', function() {
                modal.remove();
            })
            .text(t('confirm.okay'));

        return modal;
    };

    return modal;
};
