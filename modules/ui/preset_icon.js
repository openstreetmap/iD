import { select as d3_select } from 'd3-selection';

import { presetManager } from '../presets';
import { prefs } from '../core/preferences';
import { svgIcon, svgTagClasses } from '../svg';
import { utilFunctor } from '../util';


export function uiPresetIcon() {
  let _preset;
  let _geometry;


  function presetIcon(selection) {
    selection.each(render);
  }


  function getIcon(p, geom) {
    if (p.isFallback && p.isFallback()) return geom === 'vertex' ? '' : 'iD-icon-' + p.id;
    if (p.icon) return p.icon;
    if (geom === 'line') return 'iD-other-line';
    if (geom === 'vertex') return 'temaki-vertex';
    return 'maki-marker-stroked';
  }


  function renderPointBorder(container, drawPoint) {

    let pointBorder = container.selectAll('.preset-icon-point-border')
      .data(drawPoint ? [0] : []);

    pointBorder.exit()
      .remove();

    let pointBorderEnter = pointBorder.enter();

    const w = 40;
    const h = 40;

    pointBorderEnter
      .append('svg')
      .attr('class', 'preset-icon-fill preset-icon-point-border')
      .attr('width', w)
      .attr('height', h)
      .attr('viewBox', `0 0 ${w} ${h}`)
      .append('path')
      .attr('transform', 'translate(11.5, 8)')
      .attr('d', 'M 17,8 C 17,13 11,21 8.5,23.5 C 6,21 0,13 0,8 C 0,4 4,-0.5 8.5,-0.5 C 13,-0.5 17,4 17,8 z');

    pointBorder = pointBorderEnter.merge(pointBorder);
  }


  function renderCategoryBorder(container, category) {
    let categoryBorder = container.selectAll('.preset-icon-category-border')
      .data(category ? [0] : []);

    categoryBorder.exit()
      .remove();

    let categoryBorderEnter = categoryBorder.enter();

    const d = 60;

    let svgEnter = categoryBorderEnter
      .append('svg')
      .attr('class', 'preset-icon-fill preset-icon-category-border')
      .attr('width', d)
      .attr('height', d)
      .attr('viewBox', `0 0 ${d} ${d}`);

      svgEnter
        .append('path')
        .attr('class', 'area')
        .attr('d', 'M9.5,7.5 L25.5,7.5 L28.5,12.5 L49.5,12.5 C51.709139,12.5 53.5,14.290861 53.5,16.5 L53.5,43.5 C53.5,45.709139 51.709139,47.5 49.5,47.5 L10.5,47.5 C8.290861,47.5 6.5,45.709139 6.5,43.5 L6.5,12.5 L9.5,7.5 Z');

    categoryBorder = categoryBorderEnter.merge(categoryBorder);

    if (category) {
      categoryBorder.selectAll('path')
        .attr('class', `area ${category.id}`);
    }
 }


  function renderCircleFill(container, drawVertex) {
    let vertexFill = container.selectAll('.preset-icon-fill-vertex')
      .data(drawVertex ? [0] : []);

    vertexFill.exit()
      .remove();

    let vertexFillEnter = vertexFill.enter();

    const w = 60;
    const h = 60;
    const d = 40;

    vertexFillEnter
      .append('svg')
      .attr('class', 'preset-icon-fill preset-icon-fill-vertex')
      .attr('width', w)
      .attr('height', h)
      .attr('viewBox', `0 0 ${w} ${h}`)
      .append('circle')
      .attr('cx', w / 2)
      .attr('cy', h / 2)
      .attr('r', d / 2);

    vertexFill = vertexFillEnter.merge(vertexFill);
  }


  function renderSquareFill(container, drawArea, tagClasses) {

    let fill = container.selectAll('.preset-icon-fill-area')
      .data(drawArea ? [0] : []);

    fill.exit()
      .remove();

    let fillEnter = fill.enter();

    const d = 60;
    const w = d;
    const h = d;
    const l = d * 2/3;
    const c1 = (w-l) / 2;
    const c2 = c1 + l;

    fillEnter = fillEnter
      .append('svg')
      .attr('class', 'preset-icon-fill preset-icon-fill-area')
      .attr('width', w)
      .attr('height', h)
      .attr('viewBox', `0 0 ${w} ${h}`);

    ['fill', 'stroke'].forEach(klass => {
      fillEnter
        .append('path')
        .attr('d', `M${c1} ${c1} L${c1} ${c2} L${c2} ${c2} L${c2} ${c1} Z`)
        .attr('class', `area ${klass}`);
    });

    const rVertex = 2.5;
    [[c1, c1], [c1, c2], [c2, c2], [c2, c1]].forEach(point => {
      fillEnter
        .append('circle')
        .attr('class', 'vertex')
        .attr('cx', point[0])
        .attr('cy', point[1])
        .attr('r', rVertex);
    });

    const rMidpoint = 1.25;
    [[c1, w/2], [c2, w/2], [h/2, c1], [h/2, c2]].forEach(point => {
      fillEnter
        .append('circle')
        .attr('class', 'midpoint')
        .attr('cx', point[0])
        .attr('cy', point[1])
        .attr('r', rMidpoint);
    });

    fill = fillEnter.merge(fill);

    fill.selectAll('path.stroke')
      .attr('class', `area stroke ${tagClasses}`);
    fill.selectAll('path.fill')
      .attr('class', `area fill ${tagClasses}`);
  }


  function renderLine(container, drawLine, tagClasses) {

    let line = container.selectAll('.preset-icon-line')
      .data(drawLine ? [0] : []);

    line.exit()
      .remove();

    let lineEnter = line.enter();

    const d = 60;
    // draw the line parametrically
    const w = d;
    const h = d;
    const y = Math.round(d * 0.72);
    const l = Math.round(d * 0.6);
    const r = 2.5;
    const x1 = (w - l) / 2;
    const x2 = x1 + l;

    lineEnter = lineEnter
      .append('svg')
      .attr('class', 'preset-icon-line')
      .attr('width', w)
      .attr('height', h)
      .attr('viewBox', `0 0 ${w} ${h}`);

    ['casing', 'stroke'].forEach(klass => {
      lineEnter
        .append('path')
        .attr('d', `M${x1} ${y} L${x2} ${y}`)
        .attr('class', `line ${klass}`);
    });

    [[x1-1, y], [x2+1, y]].forEach(point => {
      lineEnter
        .append('circle')
        .attr('class', 'vertex')
        .attr('cx', point[0])
        .attr('cy', point[1])
        .attr('r', r);
    });

    line = lineEnter.merge(line);

    line.selectAll('path.stroke')
      .attr('class', `line stroke ${tagClasses}`);
    line.selectAll('path.casing')
      .attr('class', `line casing ${tagClasses}`);
  }


  function renderRoute(container, drawRoute, p) {

    let route = container.selectAll('.preset-icon-route')
      .data(drawRoute ? [0] : []);

    route.exit()
      .remove();

    let routeEnter = route.enter();

    const d = 60;
    // draw the route parametrically
    const w = d;
    const h = d;
    const y1 = Math.round(d * 0.80);
    const y2 = Math.round(d * 0.68);
    const l = Math.round(d * 0.6);
    const r = 2;
    const x1 = (w - l) / 2;
    const x2 = x1 + l / 3;
    const x3 = x2 + l / 3;
    const x4 = x3 + l / 3;

    routeEnter = routeEnter
      .append('svg')
      .attr('class', 'preset-icon-route')
      .attr('width', w)
      .attr('height', h)
      .attr('viewBox', `0 0 ${w} ${h}`);

    ['casing', 'stroke'].forEach(klass => {
      routeEnter
        .append('path')
        .attr('d', `M${x1} ${y1} L${x2} ${y2}`)
        .attr('class', `segment0 line ${klass}`);
      routeEnter
        .append('path')
        .attr('d', `M${x2} ${y2} L${x3} ${y1}`)
        .attr('class', `segment1 line ${klass}`);
      routeEnter
        .append('path')
        .attr('d', `M${x3} ${y1} L${x4} ${y2}`)
        .attr('class', `segment2 line ${klass}`);
    });

    [[x1, y1], [x2, y2], [x3, y1], [x4, y2]].forEach(point => {
      routeEnter
        .append('circle')
        .attr('class', 'vertex')
        .attr('cx', point[0])
        .attr('cy', point[1])
        .attr('r', r);
    });

    route = routeEnter.merge(route);

    if (drawRoute) {
      let routeType = p.tags.type === 'waterway' ? 'waterway' : p.tags.route;
      const segmentPresetIDs = routeSegments[routeType];
      for (let i in segmentPresetIDs) {
        const segmentPreset = presetManager.item(segmentPresetIDs[i]);
        const segmentTagClasses = svgTagClasses().getClassesString(segmentPreset.tags, '');
        route.selectAll(`path.stroke.segment${i}`)
          .attr('class', `segment${i} line stroke ${segmentTagClasses}`);
        route.selectAll(`path.casing.segment${i}`)
          .attr('class', `segment${i} line casing ${segmentTagClasses}`);
      }
    }
  }

  function renderSvgIcon(container, picon, geom, isFramed, category, tagClasses) {
    const isMaki = picon && /^maki-/.test(picon);
    const isTemaki = picon && /^temaki-/.test(picon);
    const isFa = picon && /^fa[srb]-/.test(picon);
    const isiDIcon = picon && !(isMaki || isTemaki || isFa);

    let icon = container.selectAll('.preset-icon')
      .data(picon ? [0] : []);

    icon.exit()
      .remove();

    icon = icon.enter()
      .append('div')
      .attr('class', 'preset-icon')
      .call(svgIcon(''))
      .merge(icon);

    icon
      .attr('class', 'preset-icon ' + (geom ? geom + '-geom' : ''))
      .classed('category', category)
      .classed('framed', isFramed)
      .classed('preset-icon-iD', isiDIcon);

    icon.selectAll('svg')
      .attr('class', 'icon ' + picon + ' ' + (!isiDIcon && geom !== 'line'  ? '' : tagClasses));

    icon.selectAll('use')
      .attr('href', '#' + picon);
  }


  function renderImageIcon(container, imageURL) {
    let imageIcon = container.selectAll('img.image-icon')
      .data(imageURL ? [0] : []);

    imageIcon.exit()
      .remove();

    imageIcon = imageIcon.enter()
      .append('img')
      .attr('class', 'image-icon')
      .on('load', () => container.classed('showing-img', true) )
      .on('error', () => container.classed('showing-img', false) )
      .merge(imageIcon);

    imageIcon
      .attr('src', imageURL);
  }

  // Route icons are drawn with a zigzag annotation underneath:
  //     o   o
  //    / \ /
  //   o   o
  // This dataset defines the styles that are used to draw the zigzag segments.
  const routeSegments = {
    bicycle: ['highway/cycleway', 'highway/cycleway', 'highway/cycleway'],
    bus: ['highway/unclassified', 'highway/secondary', 'highway/primary'],
    trolleybus: ['highway/unclassified', 'highway/secondary', 'highway/primary'],
    detour: ['highway/tertiary', 'highway/residential', 'highway/unclassified'],
    ferry: ['route/ferry', 'route/ferry', 'route/ferry'],
    foot: ['highway/footway', 'highway/footway', 'highway/footway'],
    hiking: ['highway/path', 'highway/path', 'highway/path'],
    horse: ['highway/bridleway', 'highway/bridleway', 'highway/bridleway'],
    light_rail: ['railway/light_rail', 'railway/light_rail', 'railway/light_rail'],
    monorail: ['railway/monorail', 'railway/monorail', 'railway/monorail'],
    mtb: ['highway/path', 'highway/track', 'highway/bridleway'],
    pipeline: ['man_made/pipeline', 'man_made/pipeline', 'man_made/pipeline'],
    piste: ['piste/downhill', 'piste/hike', 'piste/nordic'],
    power: ['power/line', 'power/line', 'power/line'],
    road: ['highway/secondary', 'highway/primary', 'highway/trunk'],
    subway: ['railway/subway', 'railway/subway', 'railway/subway'],
    train: ['railway/rail', 'railway/rail', 'railway/rail'],
    tram: ['railway/tram', 'railway/tram', 'railway/tram'],
    waterway: ['waterway/stream', 'waterway/stream', 'waterway/stream']
  };


  function render() {
    let p = _preset.apply(this, arguments);
    let geom = _geometry ? _geometry.apply(this, arguments) : null;
    if (geom === 'relation' &&
      p.tags &&
      ((p.tags.type === 'route' && p.tags.route && routeSegments[p.tags.route]) || p.tags.type === 'waterway')) {
      geom = 'route';
    }

    const showThirdPartyIcons = prefs('preferences.privacy.thirdpartyicons') || 'true';
    const isFallback = p.isFallback && p.isFallback();
    const imageURL = (showThirdPartyIcons === 'true') && p.imageURL;
    const picon = getIcon(p, geom);
    const isCategory = !p.setTags;
    const drawPoint = false;
    const drawVertex = picon !== null && geom === 'vertex';
    const drawLine = picon && geom === 'line' && !isFallback && !isCategory;
    const drawArea = picon && geom === 'area' && !isFallback && !isCategory;
    const drawRoute = picon && geom === 'route';
    const isFramed = drawVertex || drawArea || drawLine || drawRoute || isCategory;

    let tags = !isCategory ? p.setTags({}, geom) : {};
    for (let k in tags) {
      if (tags[k] === '*') {
        tags[k] = 'yes';
      }
    }

    let tagClasses = svgTagClasses().getClassesString(tags, '');
    let selection = d3_select(this);

    let container = selection.selectAll('.preset-icon-container')
      .data([0]);

    container = container.enter()
      .append('div')
      .attr('class', 'preset-icon-container')
      .merge(container);

    container
      .classed('showing-img', !!imageURL)
      .classed('fallback', isFallback);

    renderCategoryBorder(container, isCategory && p);
    renderPointBorder(container, drawPoint);
    renderCircleFill(container, drawVertex);
    renderSquareFill(container, drawArea, tagClasses);
    renderLine(container, drawLine, tagClasses);
    renderRoute(container, drawRoute, p);
    renderSvgIcon(container, picon, geom, isFramed, isCategory, tagClasses);
    renderImageIcon(container, imageURL);
  }


  presetIcon.preset = function(val) {
    if (!arguments.length) return _preset;
    _preset = utilFunctor(val);
    return presetIcon;
  };


  presetIcon.geometry = function(val) {
    if (!arguments.length) return _geometry;
    _geometry = utilFunctor(val);
    return presetIcon;
  };

  return presetIcon;
}
