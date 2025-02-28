import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';


export function uiDataHeader() {
    let _datum;


    function dataHeader(selection) {
        const header = selection.selectAll('.data-header')
            .data(
                (_datum ? [_datum] : []),
                function(d) { return d.__featurehash__; }
            );

        header.exit()
            .remove();

        const headerEnter = header.enter()
            .append('div')
            .attr('class', 'data-header');

        const iconEnter = headerEnter
            .append('div')
            .attr('class', 'data-header-icon');

        iconEnter
            .append('div')
            .attr('class', 'preset-icon-28')
            .call(svgIcon('#iD-icon-data', 'note-fill'));

        headerEnter
            .append('div')
            .attr('class', 'data-header-label')
            .call(t.append('map_data.layers.custom.title'));
    }


    dataHeader.datum = function(val) {
        if (!arguments.length) return _datum;
        _datum = val;
        return this;
    };


    return dataHeader;
}
