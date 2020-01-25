import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { modeSelect } from '../modes/select';
import { t } from '../util/locale';
import { services } from '../services';
import { utilDisplayName, utilEntityOrMemberSelector } from '../util';


export function uiOsmoseDetails(context) {
    var _error;


    function issueDetail(d) {
        var unknown = t('inspector.unknown');

        if (!d) return unknown;

        // Issue description supplied by Osmose
        var s = services.osmose.getStrings(d.error_type);
        return ('description' in s) ? s.description : unknown;
    }


    function osmoseDetails(selection) {
        var details = selection.selectAll('.error-details')
            .data(
                (_error ? [_error] : []),
                function(d) { return d.id + '-' + (d.status || 0); }
            );

        details.exit()
            .remove();

        var detailsEnter = details.enter()
            .append('div')
            .attr('class', 'error-details error-details-container');


        // description
        var descriptionEnter = detailsEnter
            .append('div')
            .attr('class', 'error-details-description');

        descriptionEnter
            .append('h4')
            .text(function() { return t('QA.keepRight.detail_description'); });

        descriptionEnter
            .append('div')
            .attr('class', 'error-details-description-text')
            .html(issueDetail);

        descriptionEnter
            .append('h4')
            .attr('class', 'error-details-subtitle')
            .text(function() { return t('QA.osmose.elems_title'); });

        var elementList = descriptionEnter
            .append('ul')
            .attr('class', 'error-details-elements');

        services.osmose.loadErrorDetail(_error, function(err, d) {
            if (d.elems === undefined) return;

            elementList.selectAll('.error_entity_link')
                .data(d.elems)
                .enter()
                .append('li')
                .append('a')
                .attr('class', 'error_entity_link')
                .text(function(d) { return d; })
                .each(function() {
                    var link = d3_select(this);
                    var entityID = this.textContent;
                    var entity = context.hasEntity(entityID);

                    // Add click handler
                    link
                        .on('mouseenter', function() {
                            context.surface().selectAll(utilEntityOrMemberSelector([entityID], context.graph()))
                                .classed('hover', true);
                        })
                        .on('mouseleave', function() {
                            context.surface().selectAll('.hover')
                                .classed('hover', false);
                        })
                        .on('click', function() {
                            d3_event.preventDefault();
                            var osmlayer = context.layers().layer('osm');
                            if (!osmlayer.enabled()) {
                                osmlayer.enabled(true);
                            }

                            context.map().centerZoom(d.loc, 20);

                            if (entity) {
                                context.enter(modeSelect(context, [entityID]));
                            } else {
                                context.loadEntity(entityID, function() {
                                    context.enter(modeSelect(context, [entityID]));
                                });
                            }
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

            // Things like keys and values are dynamic details
            const special = { tags: true, values: true, chars: true, sug_tags: true };
            for (let type in special) {
                if (type in d) {
                    descriptionEnter
                        .append('h4')
                        .attr('class', 'error-details-subtitle')
                        .text(function() { return t(`QA.osmose.details.${type}`); });

                    descriptionEnter
                        .append('ul')
                        .attr('class', 'error-details-list')
                        .selectAll('li')
                        .data(d[type])
                        .enter()
                        .append('li')
                        .html(function(d) { return d; });
                }
            }

            // Don't hide entities related to this error - #5880
            context.features().forceVisible(d.elems);
            context.map().pan([0,0]);  // trigger a redraw
        });
    }


    osmoseDetails.error = function(val) {
        if (!arguments.length) return _error;
        _error = val;
        return osmoseDetails;
    };


    return osmoseDetails;
}