import * as d3 from 'd3';
import _ from 'lodash';
import { t, textDirection } from '../../util/locale';
import { localize } from './helper';

import { coreGraph } from '../../core/graph';
import { dataIntroGraph } from '../../../data/intro_graph.json';
import { modeBrowse } from '../../modes/browse';
import { osmEntity } from '../../osm/entity';
import { services } from '../../services';
import { svgIcon } from '../../svg/icon';
import { uiCurtain } from '../curtain';

import { uiIntroWelcome } from './welcome';
import { uiIntroNavigation } from './navigation';
import { uiIntroPoint } from './point';
import { uiIntroArea } from './area';
import { uiIntroLine } from './line';
import { uiIntroBuilding } from './building';
import { uiIntroStartEditing } from './start_editing';


var chapterUi = {
    welcome: uiIntroWelcome,
    navigation: uiIntroNavigation,
    point: uiIntroPoint,
    area: uiIntroArea,
    line: uiIntroLine,
    building: uiIntroBuilding,
    startEditing: uiIntroStartEditing
};

var chapterFlow = [
    'welcome',
    'navigation',
    'point',
    'area',
    'line',
    'building',
    'startEditing'
];


export function uiIntro(context) {
    var introGraph = {},
        currChapter;


    // create entities for intro graph and localize names
    for (var id in dataIntroGraph) {
        introGraph[id] = osmEntity(localize(dataIntroGraph[id]));
    }


    function intro(selection) {
        context.enter(modeBrowse(context));

        // Save current map state
        var osm = context.connection(),
            history = context.history().toJSON(),
            hash = window.location.hash,
            center = context.map().center(),
            zoom = context.map().zoom(),
            background = context.background().baseLayerSource(),
            overlays = context.background().overlayLayerSources(),
            opacity = d3.selectAll('#map .layer-background').style('opacity'),
            loadedTiles = osm && osm.loadedTiles(),
            baseEntities = context.history().graph().base().entities,
            countryCode = services.geocoder.countryCode;

        // Block saving
        context.inIntro(true);

        // Load semi-real data used in intro
        if (osm) { osm.toggle(false).reset(); }
        context.history().reset();
        context.history().merge(d3.values(coreGraph().load(introGraph).entities));
        context.history().checkpoint('initial');
        context.background().bing();
        overlays.forEach(function (d) { context.background().toggleOverlayLayer(d); });

        // Mock geocoder
        services.geocoder.countryCode = function(location, callback) {
            callback(null, t('intro.graph.countrycode'));
        };

        d3.selectAll('#map .layer-background').style('opacity', 1);

        var curtain = uiCurtain();
        selection.call(curtain);

        // store that the user started the walkthrough..
        context.storage('walkthrough_started', 'yes');

        // restore previous walkthrough progress..
        var storedProgress = context.storage('walkthrough_progress') || '';
        var progress = storedProgress.split(';').filter(Boolean);

        var chapters = chapterFlow.map(function(chapter, i) {
            var s = chapterUi[chapter](context, curtain.reveal)
                .on('done', function() {
                    context.presets().init();  // clear away "recent" presets

                    buttons.filter(function(d) {
                        return d.title === s.title;
                    }).classed('finished', true);

                    if (i < chapterFlow.length - 1) {
                        var next = chapterFlow[i + 1];
                        d3.select('button.chapter-' + next)
                            .classed('next', true);
                    }

                    // store walkthrough progress..
                    progress.push(chapter);
                    context.storage('walkthrough_progress', _.uniq(progress).join(';'));
                });
            return s;
        });

        chapters[chapters.length - 1].on('startEditing', function() {
            // store walkthrough progress..
            progress.push('startEditing');
            context.storage('walkthrough_progress', _.uniq(progress).join(';'));

            // store if walkthrough is completed..
            var incomplete = _.difference(chapterFlow, progress);
            if (!incomplete.length) {
                context.storage('walkthrough_completed', 'yes');
            }

            curtain.remove();
            navwrap.remove();
            d3.selectAll('#map .layer-background').style('opacity', opacity);
            if (osm) { osm.toggle(true).reset().loadedTiles(loadedTiles); }
            context.history().reset().merge(d3.values(baseEntities));
            context.background().baseLayerSource(background);
            overlays.forEach(function (d) { context.background().toggleOverlayLayer(d); });
            if (history) { context.history().fromJSON(history, false); }
            context.map().centerZoom(center, zoom);
            window.location.replace(hash);
            services.geocoder.countryCode = countryCode;
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
            .attr('class', function(d, i) { return 'chapter chapter-' + chapterFlow[i]; })
            .on('click', enterChapter);

        buttons
            .append('span')
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

            buttons
                .classed('next', false)
                .classed('active', function(d) {
                    return d.title === currChapter.title;
                });
        }
    }


    return intro;
}
