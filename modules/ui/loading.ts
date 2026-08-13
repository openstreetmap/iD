import { select as d3_select } from 'd3-selection';
import { uiModal } from './modal';
import type { LocalizedTextRenderer } from '../core/localizer';

export interface uiLoading {
    <T extends HTMLElement>(selection: d3.Selection<T>): void;
    message: GetSet<uiLoading, string | LocalizedTextRenderer>;
    blocking: GetSet<uiLoading, boolean>;
    close(): void;
    isShown(): false | ParentNode | null;
}

export function uiLoading(context: iD.Context) {
  let _modalSelection = d3_select<HTMLDivElement, 0>(null!);
  let _message: string | LocalizedTextRenderer = '';
  let _blocking = false;


  const loading: uiLoading = <T extends HTMLElement>(selection: d3.Selection<T>) => {
    _modalSelection = uiModal<T>(selection, _blocking);

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


  loading.message = function(val) {
    if (!arguments.length) return _message;
    _message = val;
    return loading;
  } as uiLoading['message'];


  loading.blocking = function(val) {
    if (!arguments.length) return _blocking;
    _blocking = val;
    return loading;
  } as uiLoading['blocking'];


  loading.close = () => {
    _modalSelection.remove();
  };


  loading.isShown = () => {
    return _modalSelection && !_modalSelection.empty() && _modalSelection.node()!.parentNode;
  };


  return loading;
}
