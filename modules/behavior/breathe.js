import _isEqual from 'lodash-es/isEqual';

import {
    interpolateNumber as d3_interpolateNumber,
    quantize as d3_quantize
} from 'd3-interpolate';

import { select as d3_select } from 'd3-selection';
import { scaleQuantize as d3_scaleQuantize } from 'd3-scale';
import { timer as d3_timer } from 'd3-timer';


export function behaviorBreathe() {
    var duration = 800,
        steps = 4,
        selector = '.selected.shadow, .selected .shadow',
        selected = d3_select(null),
        classed = '',
        params = {},
        done = false,
        timer;


    function ratchetyInterpolator(a, b, steps, units) {
        a = parseFloat(a);
        b = parseFloat(b);
        var sample = d3_scaleQuantize()
            .domain([0, 1])
            .range(d3_quantize(d3_interpolateNumber(a, b), steps));

        return function(t) {
            return String(sample(t)) + (units || '');
        };
    }


    function reset(selection) {
        selection
            .style('stroke-opacity', null)
            .style('stroke-width', null)
            .style('fill-opacity', null)
            .style('r', null);
    }


    function setAnimationParams(transition, fromTo) {
        var toFrom = (fromTo === 'from' ? 'to' : 'from');

        transition
            .styleTween('stroke-opacity', function(d) {
                return ratchetyInterpolator(
                    params[d.id][toFrom].opacity,
                    params[d.id][fromTo].opacity,
                    steps
                );
            })
            .styleTween('stroke-width', function(d) {
                return ratchetyInterpolator(
                    params[d.id][toFrom].width,
                    params[d.id][fromTo].width,
                    steps,
                    'px'
                );
            })
            .styleTween('fill-opacity', function(d) {
                return ratchetyInterpolator(
                    params[d.id][toFrom].opacity,
                    params[d.id][fromTo].opacity,
                    steps
                );
            })
            .styleTween('r', function(d) {
                return ratchetyInterpolator(
                    params[d.id][toFrom].width,
                    params[d.id][fromTo].width,
                    steps,
                    'px'
                );
            });
    }


    function calcAnimationParams(selection) {
        selection
            .call(reset)
            .each(function(d) {
                var s = d3_select(this),
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
                p.from.width = width * 0.7;
                p.to.width = width * (tag === 'circle' ? 1.5 : 1);
                params[d.id] = p;
            });
    }


    function run(surface, fromTo) {
        var toFrom = (fromTo === 'from' ? 'to' : 'from'),
            currSelected = surface.selectAll(selector),
            currClassed = surface.attr('class');

        if (done || currSelected.empty()) {
            selected.call(reset);
            return;
        }

        if (!_isEqual(currSelected.data(), selected.data()) || currClassed !== classed) {
            selected.call(reset);
            classed = currClassed;
            selected = currSelected.call(calcAnimationParams);
        }

        selected
            .transition()
            .duration(duration)
            .call(setAnimationParams, fromTo)
            .on('end', function() {
                surface.call(run, toFrom);
            });
    }


    var breathe = function(surface) {
        done = false;
        timer = d3_timer(function() {
            // wait for elements to actually become selected
            if (surface.selectAll(selector).empty()) {
                return false;
            }

            surface.call(run, 'from');
            timer.stop();
            return true;
        }, 20);
    };


    breathe.off = function() {
        done = true;
        if (timer) {
            timer.stop();
        }
        selected
            .interrupt()
            .call(reset);
    };


    return breathe;
}
