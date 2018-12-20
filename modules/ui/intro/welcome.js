import { dispatch as d3_dispatch } from 'd3-dispatch';
import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../../util/locale';
import { utilRebind } from '../../util/rebind';


export function uiIntroWelcome(context, reveal) {
    var dispatch = d3_dispatch('done');
    var listener = clickListener();

    var chapter = {
        title: 'intro.welcome.title'
    };


    function welcome() {
        context.map().centerZoom([-85.63591, 41.94285], 19);
        reveal('.intro-nav-wrap .chapter-welcome',
            t('intro.welcome.welcome'),
            { buttonText: t('intro.ok'), buttonCallback: practice }
        );
    }

    function practice() {
        reveal('.intro-nav-wrap .chapter-welcome',
            t('intro.welcome.practice'),
            { buttonText: t('intro.ok'), buttonCallback: words }
        );
    }

    function words() {
        reveal('.intro-nav-wrap .chapter-welcome',
            t('intro.welcome.words'),
            { buttonText: t('intro.ok'), buttonCallback: mouse }
        );
    }


    function mouse() {
        reveal('.intro-nav-wrap .chapter-welcome',
            t('intro.welcome.mouse'),
            { buttonText: t('intro.ok'), buttonCallback: leftClick }
        );
    }


    function leftClick() {
        var counter = 0;
        var times = 5;

        var tooltip = reveal('.intro-nav-wrap .chapter-welcome',
            t('intro.welcome.leftclick', { num: times }),
            { tooltipClass: 'intro-mouse' }
        );

        tooltip.selectAll('.tooltip-inner')
            .insert('svg', 'span')
            .attr('class', 'tooltip-illustration')
            .append('use')
            .attr('xlink:href', '#iD-walkthrough-mouse');

        tooltip
            .append('div')
            .attr('class', 'counter');

        tooltip.call(listener);

        listener.on('click', function(which) {
            if (which === 'left') {
                d3_select('.curtain-tooltip.intro-mouse .counter')
                    .text(String(++counter));

                if (counter === times) {
                    window.setTimeout(function() { continueTo(rightClick); }, 1000);
                }
            }
        });

        function continueTo(nextStep) {
            listener.on('click', null);
            tooltip.call(listener.off);
            tooltip.select('.counter').remove();
            nextStep();
        }
    }


    function rightClick() {
        var counter = 0;
        var times = 5;

        var tooltip = reveal('.intro-nav-wrap .chapter-welcome',
            t('intro.welcome.rightclick', { num: times }),
            { tooltipClass: 'intro-mouse' }
        );

        tooltip.selectAll('.tooltip-inner')
            .insert('svg', 'span')
            .attr('class', 'tooltip-illustration')
            .append('use')
            .attr('xlink:href', '#iD-walkthrough-mouse');

        tooltip
            .append('div')
            .attr('class', 'counter');

        tooltip.call(listener);

        listener.on('click', function(which) {
            if (which === 'right') {
                d3_select('.curtain-tooltip.intro-mouse .counter')
                    .text(String(++counter));

                if (counter === times) {
                    window.setTimeout(function() { continueTo(chapters); }, 1000);
                }
            }
        });

        function continueTo(nextStep) {
            listener.on('click', null);
            tooltip.call(listener.off);
            tooltip.select('.counter').remove();
            nextStep();
        }
    }


    function chapters() {
        dispatch.call('done');
        reveal('.intro-nav-wrap .chapter-navigation',
            t('intro.welcome.chapters', { next: t('intro.navigation.title') })
        );
    }


    chapter.enter = function() {
        welcome();
    };


    chapter.exit = function() {
        listener.off();
        d3_select('.curtain-tooltip.intro-mouse')
            .selectAll('.counter')
            .remove();
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}



function clickListener() {
    var dispatch = d3_dispatch('click');
    var minTime = 120;
    var tooltip = d3_select(null);
    var down = {};

    // `down` keeps track of which buttons/keys are down.
    // Setting a property in `down` happens immediately.
    // Unsetting a property in `down` is delayed because
    //   on Windows a contextmenu event happens after keyup/mouseup

    function keydown() {
        if (d3_event.keyCode === 93)  {   // context menu
            d3_event.preventDefault();
            d3_event.stopPropagation();
            down.menu = d3_event.timeStamp;
            tooltip.classed('rightclick', true);
        }
    }


    function keyup() {
        if (d3_event.keyCode === 93)  {   // context menu
            d3_event.preventDefault();
            d3_event.stopPropagation();
            var endTime = d3_event.timeStamp;
            var startTime = down.menu || endTime;
            var delay = (endTime - startTime < minTime) ? minTime : 0;

            window.setTimeout(function() {
                tooltip.classed('rightclick', false);
                down.menu = undefined;  // delayed, for Windows
            }, delay);

            dispatch.call('click', this, 'right');
        }
    }


    function mousedown() {
        var button = d3_event.button;
        if (button === 0 && !d3_event.ctrlKey) {
            tooltip.classed('leftclick', true);
        } else if (button === 2) {
            tooltip.classed('rightclick', true);
        }
        down[button] = d3_event.timeStamp;
    }


    function mouseup() {
        var button = d3_event.button;
        var endTime = d3_event.timeStamp;
        var startTime = down[button] || endTime;
        var delay = (endTime - startTime < minTime) ? minTime : 0;

        if (button === 0 && !d3_event.ctrlKey) {
            window.setTimeout(function() {
                tooltip.classed('leftclick', false);
                down[button] = undefined;  // delayed, for Windows
            }, delay);

            dispatch.call('click', this, 'left');

        } else if (button === 2) {
            window.setTimeout(function() {
                tooltip.classed('rightclick', false);
                down[button] = undefined;  // delayed, for Windows
            }, delay);

            dispatch.call('click', this, 'right');

        } else {
            window.setTimeout(function() {
                down[button] = undefined;  // delayed, for Windows
            }, delay);
        }
    }


    function contextmenu() {
        d3_event.preventDefault();
        d3_event.stopPropagation();
        if (!down[2] && !down.menu) {
            tooltip.classed('rightclick', true);
            window.setTimeout(function() {
                tooltip.classed('rightclick', false);
            }, minTime);
            dispatch.call('click', this, 'right');
        }
    }


    var behavior = function(selection) {
        tooltip = selection;
        down = {};

        d3_select(window)
            .on('keydown.intro', keydown)
            .on('keyup.intro', keyup)
            .on('mousedown.intro', mousedown)
            .on('mouseup.intro', mouseup)
            .on('contextmenu.intro', contextmenu);
    };


    behavior.off = function() {
        d3_select(window)
            .on('keydown.intro', null)
            .on('keyup.intro', null)
            .on('mousedown.intro', null)
            .on('mouseup.intro', null)
            .on('contextmenu.intro', null);

        tooltip
            .classed('leftclick', false)
            .classed('rightclick', false);
    };

    return utilRebind(behavior, dispatch, 'on');
}

