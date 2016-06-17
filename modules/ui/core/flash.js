import { modal as modalModule } from './modal';

export function flash(selection) {
    var modal = modalModule(selection);

    modal.select('.modal').classed('modal-flash', true);

    modal.select('.content')
        .classed('modal-section', true)
        .append('div')
        .attr('class', 'description');

    modal.on('click.flash', function() { modal.remove(); });

    setTimeout(function() {
        modal.remove();
        return true;
    }, 1500);

    return modal;
}
