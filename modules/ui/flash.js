import { uiModal } from './modal';


export function uiFlash(selection) {
    var modalSelection = uiModal(selection);

    modalSelection.select('.modal')
        .classed('modal-flash', true);

    modalSelection.select('.content')
        .classed('modal-section', true)
        .append('div')
        .attr('class', 'description');

    modalSelection.on('click.flash', function() {
        modalSelection.remove();
    });

    setTimeout(function() {
        modalSelection.remove();
        return true;
    }, 1500);


    return modalSelection;
}
