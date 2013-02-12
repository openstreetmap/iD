iD.ui.restore = function(selection, history) {
    var modal = iD.ui.modal(selection);

    modal.select('.modal')
        .attr('class', 'modal-splash modal');

    var introModal = modal.select('.content')
        .append('div')
        .attr('class', 'modal-section fillL')
        .text('You have unsaved changes from a previous editing session. Do you wish to restore these changes?');

    buttons = introModal
        .append('div')
        .attr('class', 'buttons cf')
            .append('div')
            .attr('class', 'button-wrap joined col4');

    buttons.append('button')
        .attr('class', 'save action button col6')
        .text('Restore')
        .on('click', function() {
            history.load();
            modal.remove();
        });

    buttons.append('button')
        .attr('class', 'cancel button col6')
        .text('Reset')
        .on('click', function() {
            modal.remove();
        });

    return modal;
};
