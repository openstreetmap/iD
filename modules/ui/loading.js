import { select as d3_select } from 'd3-selection';
import { uiModal } from './modal';


export function uiLoading(context) {
  let _modalSelection = d3_select(null);
  let _message = '';
  let _blocking = false;


  let loading = (selection) => {
    _modalSelection = uiModal(selection, _blocking);

    let loadertext = _modalSelection.select('.content')
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


  loading.message = function(val) {
    if (!arguments.length) return _message;
    _message = val;
    return loading;
  };


  loading.blocking = function(val) {
    if (!arguments.length) return _blocking;
    _blocking = val;
    return loading;
  };


  loading.close = () => {
    _modalSelection.remove();
  };


  loading.isShown = () => {
    return _modalSelection && !_modalSelection.empty() && _modalSelection.node().parentNode;
  };


  return loading;
}
