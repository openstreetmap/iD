import { t } from '../core/localizer';
import { services } from '../services';
import { svgIcon } from '../svg/icon';
import { QAItem } from '../osm';

export function uiViewOnKeepRight() {
  let _qaItem;

  function viewOnKeepRight(selection) {
    let url;
    if (services.keepRight && (_qaItem instanceof QAItem)) {
      url = services.keepRight.issueURL(_qaItem);
    }

    const link = selection.selectAll('.view-on-keepRight')
      .data(url ? [url] : []);

    // exit
    link.exit()
      .remove();

    // enter
    const linkEnter = link.enter()
      .append('a')
        .attr('class', 'view-on-keepRight')
        .attr('target', '_blank')
        .attr('rel', 'noopener') // security measure
        .attr('href', d => d)
        .call(svgIcon('#iD-icon-out-link', 'inline'));

    linkEnter
      .append('span')
        .text(t('inspector.view_on_keepRight'));
  }

  viewOnKeepRight.what = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return viewOnKeepRight;
  };

  return viewOnKeepRight;
}
