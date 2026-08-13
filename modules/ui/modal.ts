import { select as d3_select } from 'd3-selection';

import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { utilKeybinding } from '../util';


export function uiModal<T extends HTMLElement>(this: any, selection: d3.Selection<T>, blocking?: boolean) {
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

  const close = () => {
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
    shaded.on('click.remove-modal', (d3_event: MouseEvent) => {
      if (d3_event.target === this) {
        close();
      }
    });

    modal
      .append('button')
      .attr('class', 'close')
      .attr('title', t('icons.close'))
      .on('click', close)
      .call(svgIcon('#iD-icon-close'));

    keybinding
      .on('⌫', close)
      .on('⎋', close);

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

  return Object.assign(shaded, { close });


  function moveFocusToFirst(this: HTMLInputElement) {
    let node = modal
      // there are additional rules about what's focusable, but this suits our purposes
      .select<HTMLElement>('a, button, input:not(.keytrap), select, textarea')
      .node();

    if (node) {
      node.focus();
    } else {
      d3_select(this).node()!.blur();
    }
  }

  function moveFocusToLast(this: HTMLInputElement) {
    let nodes = modal
      .selectAll<HTMLElement, 0>('a, button, input:not(.keytrap), select, textarea')
      .nodes();

    if (nodes.length) {
      nodes[nodes.length - 1].focus();
    } else {
      d3_select(this).node()!.blur();
    }
  }
}
