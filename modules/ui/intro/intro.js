import * as d3 from 'd3';
import { t, textDirection } from '../../util/locale';
import { localNames } from './helper';

import { coreGraph } from '../../core/graph';
import { dataIntroGraph } from '../../../data/intro_graph.json';
import { modeBrowse } from '../../modes/browse';
import { osmEntity } from '../../osm/entity';
import { svgIcon } from '../../svg/icon';
import { uiCurtain } from '../curtain';

import { uiIntroWelcome } from './welcome';
import { uiIntroNavigation } from './navigation';
import { uiIntroPoint } from './point';
import { uiIntroArea } from './area';
import { uiIntroLine } from './line';
import { uiIntroStartEditing } from './start_editing';


var chapterUi = {
    welcome: uiIntroWelcome,
    navigation: uiIntroNavigation,
    point: uiIntroPoint,
    area: uiIntroArea,
    line: uiIntroLine,
    startEditing: uiIntroStartEditing
};

var chapterFlow = [
    'welcome',
    'navigation',
    'point',
    'area',
    'line',
    'startEditing'
];


export function uiIntro(context) {
    var introGraph = {},
        currChapter;

    // create entities for intro graph and localize names
    for (var key in dataIntroGraph) {
        introGraph[key] = osmEntity(dataIntroGraph[key]);
        var name = localNames[key] && t('intro.graph.' + localNames[key]);
        if (name) {
            introGraph[key].tags.name = name;
        }
    }


    function intro(selection) {
        context.enter(modeBrowse(context));

        // Save current map state
        var history = context.history().toJSON(),
            hash = window.location.hash,
            center = context.map().center(),
            zoom = context.map().zoom(),
            background = context.background().baseLayerSource(),
            opacity = d3.selectAll('#map .layer-background').style('opacity'),
            loadedTiles = context.connection().loadedTiles(),
            baseEntities = context.history().graph().base().entities;

        // Block saving
        context.inIntro(true);

        // Load semi-real data used in intro
        context.connection().toggle(false).reset();
        context.history().reset();
        context.history().merge(d3.values(coreGraph().load(introGraph).entities));
        context.history().checkpoint('initial');
        context.background().bing();

        d3.selectAll('#map .layer-background').style('opacity', 1);

        var curtain = uiCurtain();
        selection.call(curtain);

        var chapters = chapterFlow.map(function(chapter, i) {
            var s = chapterUi[chapter](context, curtain.reveal)
                .on('done', function() {
                    buttons.filter(function(d) {
                        return d.title === s.title;
                    }).classed('finished', true);
                    enterChapter(chapters[i + 1]);
                });
            return s;
        });

        chapters[chapters.length - 1].on('startEditing', function() {
            curtain.remove();
            navwrap.remove();
            d3.selectAll('#map .layer-background').style('opacity', opacity);
            context.connection().toggle(true).reset().loadedTiles(loadedTiles);
            context.history().reset().merge(d3.values(baseEntities));
            context.background().baseLayerSource(background);
            if (history) context.history().fromJSON(history, false);
            context.map().centerZoom(center, zoom);
            window.location.replace(hash);
            context.inIntro(false);
        });

        var navwrap = selection
            .append('div')
            .attr('class', 'intro-nav-wrap fillD');

        navwrap
            .append('svg')
            .attr('class', 'intro-nav-wrap-logo')
            .append('use')
            .attr('xlink:href', '#logo-walkthrough');

        var buttonwrap = navwrap
            .append('div')
            .attr('class', 'joined')
            .selectAll('button.chapter');

        var buttons = buttonwrap
            .data(chapters)
            .enter()
            .append('button')
            .attr('class', 'chapter')
            .on('click', enterChapter);

        buttons
            .append('label')
            .text(function(d) { return t(d.title); });

        buttons
            .append('span')
            .attr('class', 'status')
            .call(svgIcon((textDirection === 'rtl' ? '#icon-backward' : '#icon-forward'), 'inline'));

        enterChapter(chapters[0]);


        function enterChapter(newChapter) {
            if (currChapter) { currChapter.exit(); }
            context.enter(modeBrowse(context));

            currChapter = newChapter;
            currChapter.enter();

            buttons.classed('active', function(d) {
                return d.title === currChapter.title;
            });
        }
    }


    return intro;
}
