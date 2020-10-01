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

  modal
    .append('input')
    .attr('class', 'keytrap keytrap-first')
    .on('focus.keytrap', moveFocusToLast);

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

  modal
    .append('input')
    .attr('class', 'keytrap keytrap-last')
    .on('focus.keytrap', moveFocusToFirst);

  if (animate) {
    shaded.transition().style('opacity', 1);
  } else {
    shaded.style('opacity', 1);
  }

  return shaded;


  function moveFocusToFirst() {
    let node = modal
      // there are additional rules about what's focusable, but this suits our purposes
      .select('a, button, input:not(.keytrap), select, textarea')
      .node();

    if (node) {
      node.focus();
    } else {
      d3_select(this).node().blur();
    }
  }

  function moveFocusToLast() {
    let nodes = modal
      .selectAll('a, button, input:not(.keytrap), select, textarea')
      .nodes();

    if (nodes.length) {
      nodes[nodes.length - 1].focus();
    } else {
      d3_select(this).node().blur();
    }
  }
}
