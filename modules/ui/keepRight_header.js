import { svgIcon } from '../svg/icon';
import { t, localizer } from '../core/localizer';


export function uiKeepRightHeader() {
  let _qaItem;


  function issueTitle(d) {
    const { itemType, parentIssueType } = d;
    const unknown = t.html('inspector.unknown');
    let replacements = d.replacements || {};
    replacements.default = { html: unknown };  // special key `default` works as a fallback string

    if (localizer.hasTextForStringId(`QA.keepRight.errorTypes.${itemType}.title`)) {
      return t.html(`QA.keepRight.errorTypes.${itemType}.title`, replacements);
    } else {
      return t.html(`QA.keepRight.errorTypes.${parentIssueType}.title`, replacements);
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
        .html(issueTitle);
  }


  keepRightHeader.issue = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return keepRightHeader;
  };

  return keepRightHeader;
}
