import { select as d3_select } from 'd3-selection';
import { utilFunctor } from './index';


export function tooltip() {
  var tooltip = function(selection) {
      selection.each(setup);
    },
    animation = utilFunctor(false),
    html = utilFunctor(false),
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
    placement = utilFunctor('top');


  tooltip.title = function(_) {
    if (arguments.length) {
      title = utilFunctor(_);
      return tooltip;
    } else {
      return title;
    }
  };


  tooltip.html = function(_) {
    if (arguments.length) {
      html = utilFunctor(_);
      return tooltip;
    } else {
      return html;
    }
  };


  tooltip.placement = function(_) {
    if (arguments.length) {
      placement = utilFunctor(_);
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
      .selectAll('.tooltip')
      .remove();
  };


  function setup() {
    var root = d3_select(this),
        animate = animation.apply(this, arguments),
        tip = root.selectAll('.tooltip').data([0]);

    var enter = tip.enter()
      .append('div')
      .attr('class', 'tooltip');

    enter
      .append('div')
      .attr('class', 'tooltip-arrow');

    enter
      .append('div')
      .attr('class', 'tooltip-inner');

    tip = enter
      .merge(tip);

    if (animate) {
      tip.classed('fade', true);
    }

    var place = placement.apply(this, arguments);
    tip.classed(place, true);

    root.on(over, show);
    root.on(out, hide);
  }


  function show() {
    var root = d3_select(this),
      content = title.apply(this, arguments),
      tip = root.selectAll('.tooltip')
        .classed('in', true),
      markup = html.apply(this, arguments);

    tip.selectAll('.tooltip-inner')[markup ? 'html' : 'text'](content);
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

    if (pos) {
      tip.style('left', ~~pos.x + 'px').style('top', ~~pos.y + 'px');
    } else {
      tip.style('left', null).style('top', null);
    }

    this.tooltipVisible = true;
  }


  function hide() {
    d3_select(this).selectAll('.tooltip')
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
  var mode = d3_select(node).style('position');
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
