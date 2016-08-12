import { functor } from './index';
import * as d3 from 'd3';
export function tooltip() {

  var tooltip = function(selection) {
      selection.each(setup);
    },
    animation = functor(false),
    html = functor(false),
    title = function() {
      var title = this.getAttribute('data-original-title');
      if (title) {
        return title;
      } else {
        title = this.getAttribute('title');
        this.removeAttribute('title');
        this.setAttribute('data-original-title', title);
      }
      return title;
    },
    over = 'mouseenter.tooltip',
    out = 'mouseleave.tooltip',
    placement = functor('top');

  tooltip.title = function(_) {
    if (arguments.length) {
      title = functor(_);
      return tooltip;
    } else {
      return title;
    }
  };

  tooltip.html = function(_) {
    if (arguments.length) {
      html = functor(_);
      return tooltip;
    } else {
      return html;
    }
  };

  tooltip.placement = function(_) {
    if (arguments.length) {
      placement = functor(_);
      return tooltip;
    } else {
      return placement;
    }
  };

  tooltip.show = function(selection) {
    selection.each(show);
  };

  tooltip.hide = function(selection) {
    selection.each(hide);
  };

  tooltip.toggle = function(selection) {
    selection.each(toggle);
  };

  tooltip.destroy = function(selection) {
    selection
      .on(over, null)
      .on(out, null)
      .attr('title', function() {
        return this.getAttribute('data-original-title') || this.getAttribute('title');
      })
      .attr('data-original-title', null)
      .select('.tooltip')
      .remove();
  };

  function setup() {
    var root = d3.select(this),
        animate = animation.apply(this, arguments),
        tip = root.append('div')
          .attr('class', 'tooltip');

    if (animate) {
      tip.classed('fade', true);
    }

    tip.append('div')
      .attr('class', 'tooltip-arrow');
    tip.append('div')
      .attr('class', 'tooltip-inner');

    var place = placement.apply(this, arguments);
    tip.classed(place, true);

    root.on(over, show);
    root.on(out, hide);
  }

  function show() {
    var root = d3.select(this),
      content = title.apply(this, arguments),
      tip = root.select('.tooltip')
        .classed('in', true),
      markup = html.apply(this, arguments);
    tip.select('.tooltip-inner')[markup ? 'html' : 'text'](content);
    var place = placement.apply(this, arguments),
      outer = getPosition(root.node()),
      inner = getPosition(tip.node()),
      pos;

    switch (place) {
      case 'top':
        pos = {x: outer.x + (outer.w - inner.w) / 2, y: outer.y - inner.h};
        break;
      case 'right':
        pos = {x: outer.x + outer.w, y: outer.y + (outer.h - inner.h) / 2};
        break;
      case 'left':
        pos = {x: outer.x - inner.w, y: outer.y + (outer.h - inner.h) / 2};
        break;
      case 'bottom':
        pos = {x: Math.max(0, outer.x + (outer.w - inner.w) / 2), y: outer.y + outer.h};
        break;
    }

    tip.style(pos ?
      {left: ~~pos.x + 'px', top: ~~pos.y + 'px'} :
      {left: null, top: null});

    this.tooltipVisible = true;
  }

  function hide() {
    d3.select(this).select('.tooltip')
      .classed('in', false);

    this.tooltipVisible = false;
  }

  function toggle() {
    if (this.tooltipVisible) {
      hide.apply(this, arguments);
    } else {
      show.apply(this, arguments);
    }
  }

  return tooltip;
}

function getPosition(node) {
  var mode = d3.select(node).style('position');
  if (mode === 'absolute' || mode === 'static') {
    return {
      x: node.offsetLeft,
      y: node.offsetTop,
      w: node.offsetWidth,
      h: node.offsetHeight
    };
  } else {
    return {
      x: 0,
      y: 0,
      w: node.offsetWidth,
      h: node.offsetHeight
    };
  }
}
