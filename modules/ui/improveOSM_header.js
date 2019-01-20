import { dataEn } from '../../data';
import { svgIcon } from '../svg';
import { t } from '../util/locale';


export function uiImproveOsmHeader() {
    var _error;


    function errorTitle(d) {
        var unknown = t('inspector.unknown');

        if (!d) return unknown;
        var errorType = d.error_type;
        var et = dataEn.QA.improveOSM.error_types[errorType];

        if (et && et.title) {
            return t('QA.improveOSM.error_types.' + errorType + '.title');
        } else {
            return unknown;
        }
    }


    function improveOsmHeader(selection) {
        var header = selection.selectAll('.kr_error-header')
            .data(
                (_error ? [_error] : []),
                function(d) { return d.id + '-' + (d.status || 0); }
            );

        header.exit()
            .remove();

        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'kr_error-header');

        var iconEnter = headerEnter
            .append('div')
            .attr('class', 'kr_error-header-icon')
            .classed('new', function(d) { return d.id < 0; });

        iconEnter
            .append('div')
            .attr('class', function(d) {
                return 'preset-icon-28 iOSM_error iOSM_error-' + d.id + ' iOSM_error_type_' + d.error_type + d.error_subtype;
            })
            .call(svgIcon('#iD-icon-bolt', 'iOSM_error-fill'));

        headerEnter
            .append('div')
            .attr('class', 'kr_error-header-label')
            .text(errorTitle);
    }


    improveOsmHeader.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return improveOsmHeader;
    };


    return improveOsmHeader;
}
