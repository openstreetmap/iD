import { t } from '../util/locale';
import { services } from '../services';
import { svgIcon } from '../svg/icon';
import { QAItem } from '../osm';

export function uiViewOnOsmose() {
  let _qaItem;

  function viewOnOsmose(selection) {
    let url;
    if (services.osmose && (_qaItem instanceof QAItem)) {
      url = services.osmose.itemURL(_qaItem);
    }

    const link = selection.selectAll('.view-on-osmose')
      .data(url ? [url] : []);

    // exit
    link.exit()
      .remove();

    // enter
    const linkEnter = link.enter()
      .append('a')
        .attr('class', 'view-on-osmose')
        .attr('target', '_blank')
        .attr('rel', 'noopener') // security measure
        .attr('href', d => d)
        .call(svgIcon('#iD-icon-out-link', 'inline'));

    linkEnter
      .append('span')
        .text(t('inspector.view_on_osmose'));
  }

  viewOnOsmose.what = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return viewOnOsmose;
  };

  return viewOnOsmose;
}
