import * as d3 from 'd3';
import _ from 'lodash';


export function behaviorBreathe() {
    var duration = 800,
        steps = 4,
        selector = '.selected.shadow, .selected .shadow',
        selected = d3.select(null),
        classed = '',
        params = {},
        done = false,
        timer;


    function ratchetyInterpolator(a, b, steps, units) {
        a = parseFloat(a);
        b = parseFloat(b);
        var sample = d3.scaleQuantize()
            .domain([0, 1])
            .range(d3.quantize(d3.interpolateNumber(a, b), steps));

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
        var toFrom = (fromTo === 'from' ? 'to' : 'from'),
            currSelected = surface.selectAll(selector),
            currClassed = surface.attr('class');

        if (done || currSelected.empty()) {
            selected.call(reset);
            return;
        }

        if (!_.isEqual(currSelected.data(), selected.data()) || currClassed !== classed) {
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
        timer = d3.timer(function() {
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
