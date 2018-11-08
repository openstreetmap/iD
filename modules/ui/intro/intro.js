import _difference from 'lodash-es/difference';
import _uniq from 'lodash-es/uniq';
import _values from 'lodash-es/values';

import {
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

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
    var INTRO_IMAGERY = 'EsriWorldImageryClarity';
    var introGraph = {};
    var _currChapter;

    // create entities for intro graph and localize names
    for (var id in dataIntroGraph) {
        introGraph[id] = osmEntity(localize(dataIntroGraph[id]));
    }


    function intro(selection) {
        context.enter(modeBrowse(context));

        // Save current map state
        var osm = context.connection();
        var history = context.history().toJSON();
        var hash = window.location.hash;
        var center = context.map().center();
        var zoom = context.map().zoom();
        var background = context.background().baseLayerSource();
        var overlays = context.background().overlayLayerSources();
        var opacity = d3_selectAll('#map .layer-background').style('opacity');
        var caches = osm && osm.caches();
        var baseEntities = context.history().graph().base().entities;
        var countryCode = services.geocoder.countryCode;

        // Block saving
        context.inIntro(true);

        // Load semi-real data used in intro
        if (osm) { osm.toggle(false).reset(); }
        context.history().reset();
        context.history().merge(_values(coreGraph().load(introGraph).entities));
        context.history().checkpoint('initial');

        // Setup imagery
        var imagery = context.background().findSource(INTRO_IMAGERY);
        if (imagery) {
            context.background().baseLayerSource(imagery);
        } else {
            context.background().bing();
        }
        overlays.forEach(function(d) {
            context.background().toggleOverlayLayer(d);
        });

        // Setup data layers (only OSM)
        var layers = context.layers();
        layers.all().forEach(function(item) {
            item.layer.enabled(item.id === 'osm');
        });

        // Mock geocoder
        services.geocoder.countryCode = function(location, callback) {
            callback(null, t('intro.graph.countrycode'));
        };

        // Disable the sidebar resizing button
        d3_selectAll('button.sidebar-toggle').classed('disabled', true);

        d3_selectAll('#map .layer-background').style('opacity', 1);

        var curtain = uiCurtain();
        selection.call(curtain);

        // Store that the user started the walkthrough..
        context.storage('walkthrough_started', 'yes');

        // Restore previous walkthrough progress..
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
                        d3_select('button.chapter-' + next)
                            .classed('next', true);
                    }

                    // Store walkthrough progress..
                    progress.push(chapter);
                    context.storage('walkthrough_progress', _uniq(progress).join(';'));
                });
            return s;
        });

        chapters[chapters.length - 1].on('startEditing', function() {
            // Store walkthrough progress..
            progress.push('startEditing');
            context.storage('walkthrough_progress', _uniq(progress).join(';'));

            // Store if walkthrough is completed..
            var incomplete = _difference(chapterFlow, progress);
            if (!incomplete.length) {
                context.storage('walkthrough_completed', 'yes');
            }

            curtain.remove();
            navwrap.remove();
            d3_selectAll('#map .layer-background').style('opacity', opacity);
            d3_selectAll('button.sidebar-toggle').classed('disabled', false);
            if (osm) { osm.toggle(true).reset().caches(caches); }
            context.history().reset().merge(_values(baseEntities));
            context.background().baseLayerSource(background);
            overlays.forEach(function(d) { context.background().toggleOverlayLayer(d); });
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
            .attr('xlink:href', '#iD-logo-walkthrough');

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
            .call(svgIcon((textDirection === 'rtl' ? '#iD-icon-backward' : '#iD-icon-forward'), 'inline'));

        enterChapter(chapters[0]);


        function enterChapter(newChapter) {
            if (_currChapter) { _currChapter.exit(); }
            context.enter(modeBrowse(context));

            _currChapter = newChapter;
            _currChapter.enter();

            buttons
                .classed('next', false)
                .classed('active', function(d) {
                    return d.title === _currChapter.title;
                });
        }
    }


    return intro;
}
