import { dataEn } from '../../data';
import { svgIcon } from '../svg';
import { t } from '../util/locale';


export function uiKeepRightHeader() {
    var _error;


    function errorTitle(d) {
        var unknown = t('inspector.unknown');

        if (!d) return unknown;
        var errorType = d.error_type;
        var parentErrorType = d.parent_error_type;

        var et = dataEn.QA.keepRight.errorTypes[errorType];
        var pt = dataEn.QA.keepRight.errorTypes[parentErrorType];

        if (et && et.title) {
            return t('QA.keepRight.errorTypes.' + errorType + '.title');
        } else if (pt && pt.title) {
            return t('QA.keepRight.errorTypes.' + parentErrorType + '.title');
        } else {
            return unknown;
        }
    }


    function keepRightHeader(selection) {
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
                return 'preset-icon-28 kr_error kr_error-' + d.id + ' kr_error_type_' + d.parent_error_type;
            })
            .call(svgIcon('#iD-icon-bolt', 'kr_error-fill'));

        headerEnter
            .append('div')
            .attr('class', 'kr_error-header-label')
            .text(errorTitle);
    }


    keepRightHeader.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return keepRightHeader;
    };


    return keepRightHeader;
}
