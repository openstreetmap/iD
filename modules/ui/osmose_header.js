import { services } from '../services';
import { t } from '../core/localizer';


export function uiOsmoseHeader() {
  let _qaItem;

  function issueTitle(d) {
    const unknown = t('inspector.unknown');

    if (!d) return unknown;

    // Issue titles supplied by Osmose
    const s = services.osmose.getStrings(d.itemType);
    return ('title' in s) ? s.title : unknown;
  }

  function osmoseHeader(selection) {
    const header = selection.selectAll('.qa-header')
      .data(
        (_qaItem ? [_qaItem] : []),
        d => `${d.id}-${d.status || 0}`
      );

    header.exit()
      .remove();

    const headerEnter = header.enter()
      .append('div')
        .attr('class', 'qa-header');

    const svgEnter = headerEnter
      .append('div')
        .attr('class', 'qa-header-icon')
        .classed('new', d => d.id < 0)
      .append('svg')
        .attr('width', '20px')
        .attr('height', '30px')
        .attr('viewbox', '0 0 20 30')
        .attr('class', d => `preset-icon-28 qaItem ${d.service} itemId-${d.id} itemType-${d.itemType}`);

    svgEnter
      .append('polygon')
        .attr('fill', d => services.osmose.getColor(d.item))
        .attr('class', 'qaItem-fill')
        .attr('points', '16,3 4,3 1,6 1,17 4,20 7,20 10,27 13,20 16,20 19,17.033 19,6');

    svgEnter
      .append('use')
        .attr('class', 'icon-annotation')
        .attr('width', '13px')
        .attr('height', '13px')
        .attr('transform', 'translate(3.5, 5)')
        .attr('xlink:href', d => {
          const picon = d.icon;

          if (!picon) {
            return '';
          } else {
            const isMaki = /^maki-/.test(picon);
            return `#${picon}${isMaki ? '-11' : ''}`;
          }
        });

    headerEnter
      .append('div')
        .attr('class', 'qa-header-label')
        .text(issueTitle);
  }

  osmoseHeader.issue = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return osmoseHeader;
  };

  return osmoseHeader;
}
