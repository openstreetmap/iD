// @ts-check
import { select as d3_select } from 'd3';
import { uiConfirm } from './confirm';

export function uiErrorModal() {
  let _modal = d3_select(null);
  let _title = '';
  let _subtitle = '';

  /** @param {d3.Selection} selection */
  let errorModal = (selection) => {
    _modal = uiConfirm(selection).okButton();

    _modal.select('.modal-section.header').append('h3').html(_title);
    _modal.select('.modal-section.message-text').html(_subtitle);
    _modal.select('button.close').attr('class', 'hide');

    return errorModal;
  };

  /** @param {string} val */
  errorModal.setTitle = (val) => {
    _title = val;
    return errorModal;
  };

  /** @param {string} val */
  errorModal.setSubtitle = (val) => {
    _subtitle = val;
    return errorModal;
  };

  errorModal.close = () => _modal.remove();

  return errorModal;
}
