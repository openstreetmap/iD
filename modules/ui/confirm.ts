import { t } from '../core/localizer';
import { uiModal } from './modal';


export function uiConfirm(selection: d3.Selection<HTMLElement>) {
    const modalSelection = uiModal(selection);

    modalSelection.select('.modal')
        .classed('modal-alert', true);

    const section = modalSelection.select('.content');

    section.append('div')
        .attr('class', 'modal-section header');

    section.append('div')
        .attr('class', 'modal-section message-text');

    const buttons = section.append('div')
        .attr('class', 'modal-section buttons cf');


    return Object.assign(
        modalSelection, {
        okButton: function() {
            buttons
                .append('button')
                .attr('class', 'button ok-button action')
                .on('click.confirm', function() {
                    modalSelection.remove();
                })
                .call(t.append('confirm.okay'))
                .node()!
                .focus();

            return modalSelection;
        }
    });
}
