iD.ui.Restore = function(context) {
    return function(selection) {
        if (!context.history().lock() || !context.history().restorableChanges())
            return;

        var modal = iD.ui.modal(selection);

        modal.select('.modal')
            .attr('class', 'modal fillL col6');

        var introModal = modal.select('.content');

        introModal.attr('class','cf');

        introModal.append('div')
            .attr('class', 'modal-section header')
            .append('h3')
                .text(t('restore.heading'));

        introModal.append('div')
            .attr('class','modal-section')
            .append('p')
                .text(t('restore.description'));


        var buttonWrap = introModal.append('div')
            .attr('class', 'modal-section col12');

        var buttons = buttonWrap
            .append('div')
            .attr('class', 'button-wrap joined col4');

        var restore = buttons.append('button')
            .attr('class', 'save action button col6')
            .text(t('restore.restore'))
            .on('click', function() {
                context.history().load();
                modal.remove();
            });

        buttons.append('button')
            .attr('class', 'cancel button col6')
            .text(t('restore.reset'))
            .on('click', function() {
                context.history().clearSaved();
                modal.remove();
            });

        restore.node().focus();
    };
};
