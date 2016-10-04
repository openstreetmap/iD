import { t } from '../util/locale';
import { uiModal } from './modal';


export function uiRestore(context) {

    return function(selection) {
        if (!context.history().lock() || !context.history().restorableChanges())
            return;

        var modalSelection = uiModal(selection, true);

        modalSelection.select('.modal')
            .attr('class', 'modal fillL col6');

        var introModal = modalSelection.select('.content');

        introModal
            .attr('class','cf');

        introModal
            .append('div')
            .attr('class', 'modal-section')
            .append('h3')
            .text(t('restore.heading'));

        introModal
            .append('div')
            .attr('class','modal-section')
            .append('p')
            .text(t('restore.description'));

        var buttonWrap = introModal
            .append('div')
            .attr('class', 'modal-actions cf');

        var restore = buttonWrap
            .append('button')
            .attr('class', 'restore col6')
            .text(t('restore.restore'))
            .on('click', function() {
                context.history().restore();
                modalSelection.remove();
            });

        buttonWrap
            .append('button')
            .attr('class', 'reset col6')
            .text(t('restore.reset'))
            .on('click', function() {
                context.history().clearSaved();
                modalSelection.remove();
            });

        restore.node().focus();
    };
}
