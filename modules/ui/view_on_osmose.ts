import { t } from '../core/localizer';
import { services } from '../services';
import { svgIcon } from '../svg/icon';
import { QAItem } from '../osm';

export interface uiViewOnOsmose {
    (selection: d3.Selection<HTMLDivElement>): void;
    what: GetSet<this, QAItem | undefined>
}

export function uiViewOnOsmose() {
  let _qaItem: QAItem | undefined;

  const viewOnOsmose: uiViewOnOsmose = (selection) => {
    let url;
    if (services.osmose && (_qaItem instanceof QAItem)) {
      url = services.osmose.itemURL(_qaItem);
    }

    const link = selection.selectAll<HTMLDivElement, string>('.view-on-osmose')
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
        .call(t.append('inspector.view_on_osmose'));
  };

  viewOnOsmose.what = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return viewOnOsmose;
  } as uiViewOnOsmose['what'];

  return viewOnOsmose;
}
