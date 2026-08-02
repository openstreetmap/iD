import { t } from '../core/localizer';
import { uiConfirm } from './confirm';

export function uiAsyncModal(context: iD.Context) {
    let _modal: d3.Selection<HTMLElement>;

    /**
     * Open a model, and returns a promise. The promise
     * resolves with `true` if the user clicked 'Okay',
     * or `false` if they clicked 'Cancel'
     */
    function open(title: d3.Selector, subtitle: d3.Selector) {
        return new Promise<boolean>((resolve) => {
            context.container().call((selection) => {
                _modal = uiConfirm(selection).okButton();

                _modal.select('.modal-section.header').append('h3').call(title);

                // insert the modal body
                const textSection = _modal.select<HTMLElement>('.modal-section.message-text');
                textSection.call(subtitle);

                // insert a cancel button
                const buttonSection = _modal.select('.modal-section.buttons');

                buttonSection
                    .insert('button', '.ok-button')
                    .attr('class', 'button cancel-button secondary-action')
                    .call(t.append('confirm.cancel'));

                buttonSection.select('.cancel-button').on('click.cancel', () => {
                    _modal.remove();
                    resolve(false);
                });

                buttonSection.select('.ok-button').on('click.save', () => resolve(true));
            });
        });
    }

    function close() {
        _modal.remove();
    }

    return { open, close };
}
