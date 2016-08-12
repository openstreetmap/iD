import { d3keybinding } from '../../js/lib/d3.keybinding.js';
import * as d3 from 'd3';
import { cmd } from './cmd';

export function FullScreen(context) {
    var element = context.container().node(),
        keybinding = d3keybinding('full-screen');
        // button;

    function getFullScreenFn() {
        if (element.requestFullscreen) {
            return element.requestFullscreen;
        } else if (element.msRequestFullscreen) {
            return  element.msRequestFullscreen;
        } else if (element.mozRequestFullScreen) {
            return  element.mozRequestFullScreen;
        } else if (element.webkitRequestFullscreen) {
            return element.webkitRequestFullscreen;
        }
    }

    function getExitFullScreenFn() {
        if (document.exitFullscreen) {
            return document.exitFullscreen;
        } else if (document.msExitFullscreen) {
            return  document.msExitFullscreen;
        } else if (document.mozCancelFullScreen) {
            return  document.mozCancelFullScreen;
        } else if (document.webkitExitFullscreen) {
            return document.webkitExitFullscreen;
        }
    }

    function isFullScreen() {
        return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement ||
            document.msFullscreenElement;
    }

    function isSupported() {
        return !!getFullScreenFn();
    }

    function fullScreen() {
        d3.event.preventDefault();
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

        keybinding
            .on('f11', fullScreen)
            .on(cmd('⌘⇧F'), fullScreen);

        d3.select(document)
            .call(keybinding);
    };
}
