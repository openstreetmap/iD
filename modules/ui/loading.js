import { select as d3_select } from 'd3-selection';
import { uiModal } from './modal';
import { getSet } from '../util/class';


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

    if (typeof _message === 'string') {
      loadertext
        .append('h3')
        .text(_message);
    } else {
      loadertext
        .append('h3')
        .call(_message);
    }

    _modalSelection.select('button.close')
      .attr('class', 'hide');

    return loading;
  };


  loading.message = getSet(loading, () => _message, _ => _message = _);

  loading.blocking = getSet(loading, () => _blocking, _ => _blocking = _);


  loading.close = () => {
    _modalSelection.remove();
  };


  loading.isShown = () => {
    return _modalSelection && !_modalSelection.empty() && _modalSelection.node().parentNode;
  };


  return loading;
}
