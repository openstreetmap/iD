import { event as d3_event } from 'd3-selection';

import { errorTypes } from '../../data/keepRight.json';
import { t } from '../util/locale';


export function uiKeepRightDetails(context) {
    var stringBase = 'QA.keepRight.errorTypes.';
    var _error;

    function keepRightDetails(selection) {
        if (!_error) return;

        var errorType = _error.error_type;
        var template = errorTypes[errorType];
        if (!template) return;

        // if there is a parent, save its error type e.g.:
        //  Error 191 = "highway-highway"
        //  Error 190 = "intersections without junctions"  (parent)
        var parentErrorType = (Math.floor(errorType / 10) * 10).toString();
        var parentTemplate = errorTypes[parentErrorType];
        if (!parentTemplate) return;


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

        var titleEnter = detailsEnter
            .append('div')
            .attr('class', 'kr_error-details-title');

        titleEnter
            .append('h4')
            .text(function() { return t('QA.keepRight.detail_title'); });

        titleEnter
            .append('div')
            .text(function() {
                var result;
                try {
                    result = t(stringBase + errorType + '.title');
                } catch (e) {
                    result = t(stringBase + parentErrorType + '.title');
                }
                return result;
            });


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
            .html(function(d) {
                var result;
                try {
                    result = t(stringBase + errorType + '.description', d.replacements);
                } catch (e) {
                    result = t(stringBase + parentErrorType + '.description');
                }
                return result;
            });

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
