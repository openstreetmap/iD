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
        reveal('.intro-nav-wrap',
            'Welcome!  This walkthrough will teach you the basics of editing on OpenStreetMap.',
            { buttonText: t('intro.ok'), buttonCallback: buttons }
        );
    }

    function buttons() {
        reveal('.intro-nav-wrap',
            'You can use the buttons along bottom to skip sections or restart a section if you get stuck.',
            { buttonText: t('intro.ok'), buttonCallback: function() { dispatch.call('done'); } }
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
