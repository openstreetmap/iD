import { select as d3_select } from 'd3-selection';
import { uiModal } from './modal';


export function uiLoading(context) {
    var _modalSelection = d3_select(null);
    var _message = '';
    var _blocking = false;


    var loading = function(selection) {
        _modalSelection = uiModal(selection, _blocking);

        var loadertext = _modalSelection.select('.content')
            .classed('loading-modal', true)
            .append('div')
            .attr('class', 'modal-section fillL');

        loadertext
            .append('img')
            .attr('class', 'loader')
            .attr('src', context.imagePath('loader-white.gif'));

        loadertext
            .append('h3')
            .text(_message);

        _modalSelection.select('button.close')
            .attr('class', 'hide');

        return loading;
    };


    loading.message = function(_) {
        if (!arguments.length) return _message;
        _message = _;
        return loading;
    };


    loading.blocking = function(_) {
        if (!arguments.length) return _blocking;
        _blocking = _;
        return loading;
    };


    loading.close = function() {
        _modalSelection.remove();
    };


    return loading;
}
