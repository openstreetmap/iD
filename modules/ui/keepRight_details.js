import { event as d3_event } from 'd3-selection';

import { dataEn } from '../../data';
import { t } from '../util/locale';


export function uiKeepRightDetails(context) {
    var _error;


    function errorDetail(d) {
        var unknown = t('inspector.unknown');

        if (!d) return unknown;
        var errorType = d.error_type;
        var parentErrorType = d.parent_error_type;

        var et = dataEn.QA.keepRight.errorTypes[errorType];
        var pt = dataEn.QA.keepRight.errorTypes[parentErrorType];

        var detail;
        if (et && et.description) {
            detail = t('QA.keepRight.errorTypes.' + errorType + '.description', d.replacements);
        } else if (pt && pt.description) {
            detail = t('QA.keepRight.errorTypes.' + parentErrorType + '.description', d.replacements);
        } else {
            detail = unknown;
        }
        return detail.substr(0, 1).toUpperCase() + detail.substr(1);
    }


    function keepRightDetails(selection) {
        var details = selection.selectAll('.kr_error-details')
            .data(
                (_error ? [_error] : []),
                function(d) { return d.id + '-' + (d.status || 0); }
            );

        details.exit()
            .remove();

        var detailsEnter = details.enter()
            .append('div')
            .attr('class', 'kr_error-details kr_error-details-container');


        // description
        var description = detailsEnter
            .append('div')
            .attr('class', 'kr_error-details-description');

        description
            .append('h4')
            .text(function() { return t('QA.keepRight.detail_description'); });

        description
            .append('div')
            .attr('class', 'kr_error-details-description-text')
            .html(errorDetail);

        description.selectAll('.kr_error_description-id')
            .on('click', function() { clickLink(context, this.text); });


        function clickLink(context, entityID) {
            d3_event.preventDefault();
            context.layers().layer('osm').enabled(true);
            context.zoomToEntity(entityID);
        }
    }


    keepRightDetails.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return keepRightDetails;
    };


    return keepRightDetails;
}
