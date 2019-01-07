import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { dataEn } from '../../data';
import { modeSelect } from '../modes';
import { t } from '../util/locale';
import { utilDisplayName, utilEntityOrMemberSelector } from '../util';


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
        var descriptionEnter = detailsEnter
            .append('div')
            .attr('class', 'kr_error-details-description');

        descriptionEnter
            .append('h4')
            .text(function() { return t('QA.keepRight.detail_description'); });

        descriptionEnter
            .append('div')
            .attr('class', 'kr_error-details-description-text')
            .html(errorDetail);

        // If there are entity links in the error message..
        descriptionEnter.selectAll('.kr_error_entity_link')
            .each(function() {
                var link = d3_select(this);
                var entityID = this.innerText;
                var entity = context.hasEntity(entityID);

                // Add click handler
                link
                    .on('mouseover', function() {
                        context.surface().selectAll(utilEntityOrMemberSelector([entityID], context.graph()))
                            .classed('hover', true);
                    })
                    .on('mouseout', function() {
                        context.surface().selectAll('.hover')
                            .classed('hover', false);
                    })
                    .on('click', function() {
                        d3_event.preventDefault();
                        var osmlayer = context.layers().layer('osm');
                        if (!osmlayer.enabled()) {
                            osmlayer.enabled(true);
                        }
                        context.map().centerZoom(_error.loc, 20);
                        context.enter(modeSelect(context, [entityID]));
                    });

                // Replace with friendly name if possible
                // (The entity may not yet be loaded into the graph)
                if (entity) {
                    var name = utilDisplayName(entity);  // try to use common name
                    if (!name) {
                        var preset = context.presets().match(entity, context.graph());
                        name = preset && !preset.isFallback() && preset.name();  // fallback to preset name
                    }

                    if (name) {
                        this.innerText = name;
                    }
                }
            });
    }


    keepRightDetails.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return keepRightDetails;
    };


    return keepRightDetails;
}
