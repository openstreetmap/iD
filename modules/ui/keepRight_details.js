import { event as d3_event } from 'd3-selection';

import { dataEn } from '../../data';
import { errorTypes } from '../../data/keepRight.json';
import { t } from '../util/locale';


export function uiKeepRightDetails(context) {
    var _error;


    function errorDetail(d) {
        var unknown = t('inspector.unknown');

        if (!d) return unknown;
        var errorType = d.error_type;

        var template = errorTypes[errorType];
        if (!template) return unknown;

        // if there is a parent, save its error type e.g.:
        //  Error 191 = "highway-highway"
        //  Error 190 = "intersections without junctions"  (parent)
        var parentErrorType = (Math.floor(errorType / 10) * 10).toString();
        var parentTemplate = errorTypes[parentErrorType];
        if (!parentTemplate) return unknown;

        var et = dataEn.QA.keepRight.errorTypes[errorType];
        var pt = dataEn.QA.keepRight.errorTypes[parentErrorType];

        if (et && et.description) {
            return t('QA.keepRight.errorTypes.' + errorType + '.description', d.replacements);
        } else if (pt && pt.description) {
            return t('QA.keepRight.errorTypes.' + parentErrorType + '.description', d.replacements);
        } else {
            return unknown;
        }
    }


    function keepRightDetails(selection) {
        var details = selection.selectAll('.kr_error-details')
            .data(
                (_error ? [_error] : []),
                function(d) { return d.status + d.id; }
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


    keepRightDetails.error = function(_) {
        if (!arguments.length) return _error;
        _error = _;
        return keepRightDetails;
    };


    return keepRightDetails;
}
