import * as d3 from 'd3';
import _ from 'lodash';
export function Breathe(){
    var duration = 800,
        selector = '.selected.shadow, .selected .shadow',
        selected = d3.select(null),
        classed = '',
        params = {},
        done;

    function reset(selection) {
        selection
            .style('stroke-opacity', null)
            .style('stroke-width', null)
            .style('fill-opacity', null)
            .style('r', null);
    }

    function setAnimationParams(transition, fromTo) {
        transition
            .style('stroke-opacity', function(d) { return params[d.id][fromTo].opacity; })
            .style('stroke-width', function(d) { return params[d.id][fromTo].width; })
            .style('fill-opacity', function(d) { return params[d.id][fromTo].opacity; })
            .style('r', function(d) { return params[d.id][fromTo].width; });
    }

    function calcAnimationParams(selection) {
        selection
            .call(reset)
            .each(function(d) {
                var s = d3.select(this),
                    tag = s.node().tagName,
                    p = {'from': {}, 'to': {}},
                    opacity, width;

                // determine base opacity and width
                if (tag === 'circle') {
                    opacity = parseFloat(s.style('fill-opacity') || 0.5);
                    width = parseFloat(s.style('r') || 15.5);
                } else {
                    opacity = parseFloat(s.style('stroke-opacity') || 0.7);
                    width = parseFloat(s.style('stroke-width') || 10);
                }

                // calculate from/to interpolation params..
                p.tag = tag;
                p.from.opacity = opacity * 0.6;
                p.to.opacity = opacity * 1.25;
                p.from.width = width * 0.9;
                p.to.width = width * (tag === 'circle' ? 1.5 : 1.25);
                params[d.id] = p;
            });
    }

    function run(surface, fromTo) {
        var toFrom = (fromTo === 'from' ? 'to': 'from'),
            currSelected = surface.selectAll(selector),
            currClassed = surface.attr('class'),
            n = 0;

        if (done || currSelected.empty()) {
            selected.call(reset);
            return;
        }

        if (!_.isEqual(currSelected, selected) || currClassed !== classed) {
            selected.call(reset);
            classed = currClassed;
            selected = currSelected.call(calcAnimationParams);
        }

        selected
            .transition()
            .call(setAnimationParams, fromTo)
            .duration(duration)
            .each(function() { ++n; })
            .each('end', function() {
                if (!--n) {  // call once
                    surface.call(run, toFrom);
                }
            });
    }

    var breathe = function(surface) {
        done = false;
        d3.timer(function() {
            if (done) return true;

            var currSelected = surface.selectAll(selector);
            if (currSelected.empty()) return false;

            surface.call(run, 'from');
            return true;
        }, 200);
    };

    breathe.off = function() {
        done = true;
        d3.timer.flush();
        selected
            .transition()
            .call(reset)
            .duration(0);
    };

    return breathe;
}
