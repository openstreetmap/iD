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
            .on('click', function() {
                context.history().restore();
                modalSelection.remove();
            });

        restore
            .append('svg')
            .attr('class', 'logo logo-restore')
            .append('use')
            .attr('xlink:href', '#logo-restore');

        restore
            .append('div')
            .text(t('restore.restore'));

        var reset = buttonWrap
            .append('button')
            .attr('class', 'reset col6')
            .on('click', function() {
                context.history().clearSaved();
                modalSelection.remove();
            });

        reset
            .append('svg')
            .attr('class', 'logo logo-reset')
            .append('use')
            .attr('xlink:href', '#logo-reset');

        reset
            .append('div')
            .text(t('restore.reset'));

        restore.node().focus();
    };
}
