import { t, localizer } from '../../core/localizer';
import { localize } from './helper';

import { prefs } from '../../core/preferences';
import { fileFetcher } from '../../core/file_fetcher';
import { coreGraph } from '../../core/graph';
import { modeBrowse } from '../../modes/browse';
import { osmEntity } from '../../osm/entity';
import { svgIcon } from '../../svg/icon';
import { uiCurtain } from '../curtain';
import { utilArrayDifference, utilArrayUniq } from '../../util';

import { uiIntroWelcome } from './welcome';
import { uiIntroNavigation } from './navigation';
import { uiIntroPoint } from './point';
import { uiIntroArea } from './area';
import { uiIntroLine } from './line';
import { uiIntroBuilding } from './building';
import { uiIntroStartEditing } from './start_editing';


const chapterUi = {
  welcome: uiIntroWelcome,
  navigation: uiIntroNavigation,
  point: uiIntroPoint,
  area: uiIntroArea,
  line: uiIntroLine,
  building: uiIntroBuilding,
  startEditing: uiIntroStartEditing
};

const chapterFlow = [
  'welcome',
  'navigation',
  'point',
  'area',
  'line',
  'building',
  'startEditing'
];


export function uiIntro(context) {
  const INTRO_IMAGERY = 'EsriWorldImageryClarity';
  let _introGraph = {};
  let _currChapter;


  function intro(selection) {
    fileFetcher.get('intro_graph')
      .then(dataIntroGraph => {
        // create entities for intro graph and localize names
        for (let id in dataIntroGraph) {
          if (!_introGraph[id]) {
            _introGraph[id] = osmEntity(localize(dataIntroGraph[id]));
          }
        }
        selection.call(startIntro);
      })
      .catch(function() { /* ignore */ });
  }


  function startIntro(selection) {
    context.enter(modeBrowse(context));

    // Save current map state
    let osm = context.connection();
    let history = context.history().toJSON();
    let hash = window.location.hash;
    let center = context.map().center();
    let zoom = context.map().zoom();
    let background = context.background().baseLayerSource();
    let overlays = context.background().overlayLayerSources();
    let opacity = context.container().selectAll('.main-map .layer-background').style('opacity');
    let caches = osm && osm.caches();
    let baseEntities = context.history().graph().base().entities;

    // Show sidebar and disable the sidebar resizing button
    // (this needs to be before `context.inIntro(true)`)
    context.ui().sidebar.expand();
    context.container().selectAll('button.sidebar-toggle').classed('disabled', true);

    // Block saving
    context.inIntro(true);

    // Load semi-real data used in intro
    if (osm) { osm.toggle(false).reset(); }
    context.history().reset();
    context.history().merge(Object.values(coreGraph().load(_introGraph).entities));
    context.history().checkpoint('initial');

    // Setup imagery
    let imagery = context.background().findSource(INTRO_IMAGERY);
    if (imagery) {
      context.background().baseLayerSource(imagery);
    } else {
      context.background().bing();
    }
    overlays.forEach(d => context.background().toggleOverlayLayer(d));

    // Setup data layers (only OSM)
    let layers = context.layers();
    layers.all().forEach(item => {
      // if the layer has the function `enabled`
      if (typeof item.layer.enabled === 'function') {
        item.layer.enabled(item.id === 'osm');
      }
    });


    context.container().selectAll('.main-map .layer-background').style('opacity', 1);

    let curtain = uiCurtain(context.container().node());
    selection.call(curtain);

    // Store that the user started the walkthrough..
    prefs('walkthrough_started', 'yes');

    // Restore previous walkthrough progress..
    let storedProgress = prefs('walkthrough_progress') || '';
    let progress = storedProgress.split(';').filter(Boolean);

    let chapters = chapterFlow.map((chapter, i) => {
      let s = chapterUi[chapter](context, curtain.reveal)
        .on('done', () => {

          buttons
            .filter(d => d.title === s.title)
            .classed('finished', true);

          if (i < chapterFlow.length - 1) {
            const next = chapterFlow[i + 1];
            context.container().select(`button.chapter-${next}`)
              .classed('next', true);
          }

          // Store walkthrough progress..
          progress.push(chapter);
          prefs('walkthrough_progress', utilArrayUniq(progress).join(';'));
        });
      return s;
    });

    chapters[chapters.length - 1].on('startEditing', () => {
      // Store walkthrough progress..
      progress.push('startEditing');
      prefs('walkthrough_progress', utilArrayUniq(progress).join(';'));

      // Store if walkthrough is completed..
      let incomplete = utilArrayDifference(chapterFlow, progress);
      if (!incomplete.length) {
        prefs('walkthrough_completed', 'yes');
      }

      curtain.remove();
      navwrap.remove();
      context.container().selectAll('.main-map .layer-background').style('opacity', opacity);
      context.container().selectAll('button.sidebar-toggle').classed('disabled', false);
      if (osm) { osm.toggle(true).reset().caches(caches); }
      context.history().reset().merge(Object.values(baseEntities));
      context.background().baseLayerSource(background);
      overlays.forEach(d => context.background().toggleOverlayLayer(d));
      if (history) { context.history().fromJSON(history, false); }
      context.map().centerZoom(center, zoom);
      window.location.replace(hash);
      context.inIntro(false);
    });

    let navwrap = selection
      .append('div')
      .attr('class', 'intro-nav-wrap fillD');

    navwrap
      .append('svg')
      .attr('class', 'intro-nav-wrap-logo')
      .append('use')
      .attr('xlink:href', '#iD-logo-walkthrough');

    let buttonwrap = navwrap
      .append('div')
      .attr('class', 'joined')
      .selectAll('button.chapter');

    let buttons = buttonwrap
      .data(chapters)
      .enter()
      .append('button')
      .attr('class', (d, i) => `chapter chapter-${chapterFlow[i]}`)
      .on('click', enterChapter);

    buttons
      .append('span')
      .text(d => t(d.title));

    buttons
      .append('span')
      .attr('class', 'status')
      .call(svgIcon((localizer.textDirection() === 'rtl' ? '#iD-icon-backward' : '#iD-icon-forward'), 'inline'));

    enterChapter(chapters[0]);


    function enterChapter(newChapter) {
      if (_currChapter) { _currChapter.exit(); }
      context.enter(modeBrowse(context));

      _currChapter = newChapter;
      _currChapter.enter();

      buttons
        .classed('next', false)
        .classed('active', d => d.title === _currChapter.title);
    }
  }


  return intro;
}
