import { event as d3_event, select as d3_select } from 'd3-selection';

import { svgIcon } from '../svg/icon';
import { utilKeybinding } from '../util';


export function uiModal(selection, blocking) {
  let keybinding = utilKeybinding('modal');
  let previous = selection.select('div.modal');
  let animate = previous.empty();

  previous.transition()
    .duration(200)
    .style('opacity', 0)
    .remove();

  let shaded = selection
    .append('div')
    .attr('class', 'shaded')
    .style('opacity', 0);

  shaded.close = () => {
    shaded
      .transition()
      .duration(200)
      .style('opacity',0)
      .remove();

    modal
      .transition()
      .duration(200)
      .style('top','0px');

    d3_select(document)
      .call(keybinding.unbind);
  };


  let modal = shaded
    .append('div')
    .attr('class', 'modal fillL');

  if (!blocking) {
    shaded.on('click.remove-modal', () => {
      if (d3_event.target === this) {
        shaded.close();
      }
    });

    modal
      .append('button')
      .attr('class', 'close')
      .on('click', shaded.close)
      .call(svgIcon('#iD-icon-close'));

    keybinding
      .on('⌫', shaded.close)
      .on('⎋', shaded.close);

    d3_select(document)
      .call(keybinding);
  }

  modal
    .append('div')
    .attr('class', 'content');

  if (animate) {
    shaded.transition().style('opacity', 1);
  } else {
    shaded.style('opacity', 1);
  }

  return shaded;
}
