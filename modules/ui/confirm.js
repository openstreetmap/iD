import { modal as modalModule } from './modal';

export function confirm(selection) {
    var modal = modalModule(selection);

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
}
