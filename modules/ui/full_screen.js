import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import { uiCmd } from './cmd';
import { utilDetect } from '../util/detect';


export function uiFullScreen(context) {
    var element = context.container().node(),
        keybinding = d3_keybinding('full-screen');
        // button;


    function getFullScreenFn() {
        if (element.requestFullscreen) {
            return element.requestFullscreen;
        } else if (element.msRequestFullscreen) {
            return element.msRequestFullscreen;
        } else if (element.mozRequestFullScreen) {
            return element.mozRequestFullScreen;
        } else if (element.webkitRequestFullscreen) {
            return element.webkitRequestFullscreen;
        }
    }


    function getExitFullScreenFn() {
        if (document.exitFullscreen) {
            return document.exitFullscreen;
        } else if (document.msExitFullscreen) {
            return document.msExitFullscreen;
        } else if (document.mozCancelFullScreen) {
            return document.mozCancelFullScreen;
        } else if (document.webkitExitFullscreen) {
            return document.webkitExitFullscreen;
        }
    }


    function isFullScreen() {
        return document.fullscreenElement ||
            document.mozFullScreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement;
    }


    function isSupported() {
        return !!getFullScreenFn();
    }


    function fullScreen() {
        d3_event.preventDefault();
        if (!isFullScreen()) {
            // button.classed('active', true);
            getFullScreenFn().apply(element);
        } else {
            // button.classed('active', false);
            getExitFullScreenFn().apply(document);
        }
    }


    return function() { // selection) {
        if (!isSupported())
            return;

        // button = selection.append('button')
        //     .attr('title', t('full_screen'))
        //     .attr('tabindex', -1)
        //     .on('click', fullScreen)
        //     .call(tooltip);

        // button.append('span')
        //     .attr('class', 'icon full-screen');

        var detected = utilDetect();
        var keys = detected.os === 'mac' ? [uiCmd('⌃⌘F'), 'f11'] : ['f11'];
        keybinding.on(keys, fullScreen);

        d3_select(document)
            .call(keybinding);
    };
}
