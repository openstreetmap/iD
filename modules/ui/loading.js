import { uiModal } from './modal';

export function uiLoading(context) {
    var message = '',
        blocking = false,
        modalSelection;


    var loading = function(selection) {
        modalSelection = uiModal(selection, blocking);

        var loadertext = modalSelection.select('.content')
            .classed('loading-modal', true)
            .append('div')
            .attr('class', 'modal-section fillL');

        loadertext
            .append('img')
            .attr('class', 'loader')
            .attr('src', context.imagePath('loader-white.gif'));

        loadertext
            .append('h3')
            .text(message);

        modalSelection.select('button.close')
            .attr('class', 'hide');

        return loading;
    };


    loading.message = function(_) {
        if (!arguments.length) return message;
        message = _;
        return loading;
    };


    loading.blocking = function(_) {
        if (!arguments.length) return blocking;
        blocking = _;
        return loading;
    };


    loading.close = function() {
        modalSelection.remove();
    };


    return loading;
}
