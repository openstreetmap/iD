import { event as d3_event } from 'd3-selection';

import { errorTypes } from '../../data/keepRight.json';
import { t } from '../util/locale';


export function uiKeepRightDetails(context) {
    var _error;
    var _template;
    var _templateErrorType;
    var _category;
    var _categoryElements;
    var _parent_error_type;
    var _titleBase;


    function initDetails() {
        _parent_error_type = '';
        if (errorTypes.errors['_' + _error.error_type]) {
            _templateErrorType = '_' + _error.error_type;
            _template = errorTypes.errors[_templateErrorType];
            _category = 'errors';
        } else if (errorTypes.warnings[_templateErrorType]) {
            _template = errorTypes.warnings[_templateErrorType];
            _category = 'warnings';
        } else { return; }

        // if there is a parent, save it's error type
        _categoryElements = errorTypes[_category];
        var base_error_type = (Math.round(_error.error_type / 10) * 10).toString();
        if ((_categoryElements['_' + base_error_type]) && (base_error_type !== _error.error_type) ) {
            _parent_error_type = '_' + base_error_type;
        }

        _titleBase = 'QA.keepRight.errorTypes.' + _category + '.';

    }


    function keepRightDetails(selection) {
        if (!_error || !_error.error_type) return;

        initDetails();
        if (!_template) return;


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


        // title
        var title = detailsEnter
            .append('div')
            .attr('class', 'kr_error-details-title');

        title.append('h4')
            .text(function() { return t('QA.keepRight.detail_title'); });

        title.append('div')
            .text(function() {
                var title = '';

                // if this is a subtype, append it's parent title
                if (_parent_error_type) {
                    title = t(_titleBase + _parent_error_type + '.title') + ': \n';
                }

                // append title
                if (_error.error_type) {
                    title += t(_titleBase + _templateErrorType + '.title');
                }

                return title;
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
                return t(_titleBase + _templateErrorType + '.description', d.replacements);
            });

        description.selectAll('.kr_error_description-id')
            .on('click', function() { clickLink(context, this.text); });


        function clickLink(context, id) {
            d3_event.preventDefault();
            context.layers().layer('osm').enabled(true);
            context.zoomToEntity(id);
        }
    }


    keepRightDetails.error = function(_) {
        if (!arguments.length) return _error;
        _error = _;
        return keepRightDetails;
    };


    return keepRightDetails;
}
