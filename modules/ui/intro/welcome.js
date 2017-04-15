import * as d3 from 'd3';
import { t } from '../../util/locale';
import { utilRebind } from '../../util/rebind';


export function uiIntroWelcome(context, reveal) {
    var dispatch = d3.dispatch('done');


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
            { buttonText: t('intro.ok'), buttonCallback: chapters }
        );
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
    };


    chapter.restart = function() {
        chapter.exit();
        chapter.enter();
    };


    return utilRebind(chapter, dispatch, 'on');
}
