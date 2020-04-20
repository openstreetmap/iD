import { t } from '../core/localizer';
import { uiModal } from './modal';


export function uiRestore(context) {
  return function(selection) {
    if (!context.history().hasRestorableChanges()) return;

    let modalSelection = uiModal(selection, true);

    modalSelection.select('.modal')
      .attr('class', 'modal fillL');

    let introModal = modalSelection.select('.content');

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

    let buttonWrap = introModal
      .append('div')
      .attr('class', 'modal-actions');

    let restore = buttonWrap
      .append('button')
      .attr('class', 'restore')
      .on('click', () => {
        context.history().restore();
        modalSelection.remove();
      });

    restore
      .append('svg')
      .attr('class', 'logo logo-restore')
      .append('use')
      .attr('xlink:href', '#iD-logo-restore');

    restore
      .append('div')
      .text(t('restore.restore'));

    let reset = buttonWrap
      .append('button')
      .attr('class', 'reset')
      .on('click', () => {
        context.history().clearSaved();
        modalSelection.remove();
      });

    reset
      .append('svg')
      .attr('class', 'logo logo-reset')
      .append('use')
      .attr('xlink:href', '#iD-logo-reset');

    reset
      .append('div')
      .text(t('restore.reset'));

    restore.node().focus();
  };
}
