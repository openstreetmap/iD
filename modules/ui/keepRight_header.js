import { svgIcon } from '../svg/icon';
import { t } from '../core/localizer';


export function uiKeepRightHeader() {
  let _qaItem;


  function issueTitle(d) {
    const { itemType, parentIssueType } = d;
    const unknown = t('inspector.unknown');
    let replacements = d.replacements || {};
    replacements.default = unknown;  // special key `default` works as a fallback string

    let title = t(`QA.keepRight.errorTypes.${itemType}.title`, replacements);
    if (title === unknown) {
      title = t(`QA.keepRight.errorTypes.${parentIssueType}.title`, replacements);
    }
    return title;
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


  keepRightHeader.issue = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return keepRightHeader;
  };

  return keepRightHeader;
}
