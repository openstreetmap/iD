import { dataEn } from '../../data';
import { svgIcon } from '../svg/icon';
import { t } from '../util/locale';


export function uiKeepRightHeader() {
  let _qaItem;

  function issueTitle(d) {
    const unknown = t('inspector.unknown');

    if (!d) return unknown;
    const { itemType, parentIssueType } = d;

    const et = dataEn.QA.keepRight.errorTypes[itemType];
    const pt = dataEn.QA.keepRight.errorTypes[parentIssueType];

    if (et && et.title) {
      return t(`QA.keepRight.errorTypes.${itemType}.title`);
    } else if (pt && pt.title) {
      return t(`QA.keepRight.errorTypes.${parentIssueType}.title`);
    } else {
      return unknown;
    }
  }

  function keepRightHeader(selection) {
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

    const iconEnter = headerEnter
      .append('div')
        .attr('class', 'qa-header-icon')
        .classed('new', d => d.id < 0);

    iconEnter
      .append('div')
        .attr('class', d => `preset-icon-28 qaItem ${d.service} itemId-${d.id} itemType-${d.parentIssueType}`)
        .call(svgIcon('#iD-icon-bolt', 'qaItem-fill'));

    headerEnter
      .append('div')
        .attr('class', 'qa-header-label')
        .text(issueTitle);
  }

  keepRightHeader.issue = val => {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return keepRightHeader;
  };

  return keepRightHeader;
}
