iD.ui.Restore = function(context) {
    return function(selection) {
        if (!context.history().lock() || !context.history().restorableChanges())
            return;

        var modal = iD.ui.modal(selection);

        modal.select('.modal')
            .attr('class', 'modal-splash modal');

        var introModal = modal.select('.content');

        introModal.append('div')
            .attr('class', 'modal-section fillL')
            .append('h3')
            .text(t('restore.description'));

        var buttonWrap = introModal.append('div')
            .attr('class', 'modal-section cf col12');

        var buttons = buttonWrap
            .append('div')
            .attr('class', 'button-wrap joined col6');

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
