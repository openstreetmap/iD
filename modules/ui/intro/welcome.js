import { dispatch as d3_dispatch } from 'd3-dispatch';

import { helpString } from './helper';
import { t } from '../../core/localizer';
import { utilRebind } from '../../util/rebind';


export function uiIntroWelcome(context, reveal) {
    var dispatch = d3_dispatch('done');

    var chapter = {
        title: 'intro.welcome.title'
    };


    function welcome() {
        context.map().centerZoom([-85.63591, 41.94285], 19);
        reveal('.intro-nav-wrap .chapter-welcome',
            helpString('intro.welcome.welcome'),
            { buttonText: t('intro.ok'), buttonCallback: practice }
        );
    }

    function practice() {
        reveal('.intro-nav-wrap .chapter-welcome',
            helpString('intro.welcome.practice'),
            { buttonText: t('intro.ok'), buttonCallback: words }
        );
    }

    function words() {
        reveal('.intro-nav-wrap .chapter-welcome',
            helpString('intro.welcome.words'),
            { buttonText: t('intro.ok'), buttonCallback: chapters }
        );
    }


    function chapters() {
        dispatch.call('done');
        reveal('.intro-nav-wrap .chapter-navigation',
            helpString('intro.welcome.chapters', { next: t('intro.navigation.title') })
        );
    }


    chapter.enter = function() {
        welcome();
    };


    chapter.exit = function() {
        context.container().select('.curtain-tooltip.intro-mouse')
            .selectAll('.counter')
            .remove();
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
