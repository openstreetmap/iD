import { t } from '../util/locale';
import { utilGetErrorDetails } from '../util';


export function uiKeepRightDetails() {
    var _error;


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
            .attr('class', 'kr_error-details');

        detailsEnter
            .append('div')
            .attr('class', 'kr_error-details-label')
            .text(function(d) {
                var error = utilGetErrorDetails(d);
                return t('keepRight.keepRight'); // TODO: add details here
            });
    }


    keepRightDetails.error = function(_) {
        if (!arguments.length) return _error;
        _error = _;
        return keepRightDetails;
    };


    return keepRightDetails;
}
