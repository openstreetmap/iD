import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { modeSelect } from '../modes/select';
import { t } from '../util/locale';
import { services } from '../services';
import { utilDisplayName, utilEntityOrMemberSelector } from '../util';


export function uiOsmoseDetails(context) {
    let _error;
    const unknown = t('inspector.unknown');


    function issueString(d, type) {
        if (!d) return unknown;

        // Issue description supplied by Osmose
        var s = services.osmose.getStrings(d.error_type);
        return (type in s) ? s[type] : unknown;
    }


    function osmoseDetails(selection) {
        var details = selection.selectAll('.error-details')
            .data(
                _error ? [_error] : [],
                d => `${d.id}-${d.status || 0}`
            );

        details.exit()
            .remove();

        var detailsEnter = details.enter()
            .append('div')
            .attr('class', 'error-details error-details-container');


        var descriptionEnter = detailsEnter
            .append('div')
            .attr('class', 'error-details-description');

        // Description
        descriptionEnter
            .append('h4')
            .text(() => t('QA.keepRight.detail_description'));

        descriptionEnter
            .append('p')
            .attr('class', 'error-details-description-text')
            .html(d => issueString(d, 'detail'));

        // Elements (populated later as data is requested)
        const detailsDiv = descriptionEnter
            .append('div')
            .attr('class', 'error-details-subsection');

        const elemsDiv = descriptionEnter
            .append('div')
            .attr('class', 'error-details-subsection');

        // Suggested Fix (musn't exist for every issue type)
        if (issueString(_error, 'fix') !== unknown) {
            let div = descriptionEnter
                .append('div')
                .attr('class', 'error-details-subsection')

            div.append('h4')
                .text(() => t('QA.osmose.fix_title'))

            div.append('p')
                .html(d => issueString(d, 'fix'));
        }

        // Common Pitfalls (musn't exist for every issue type)
        if (issueString(_error, 'trap') !== unknown) {
            let div = descriptionEnter
                .append('div')
                .attr('class', 'error-details-subsection')

            div.append('h4')
                .text(() => t('QA.osmose.trap_title'))

            div.append('p')
                .html(d => issueString(d, 'trap'));
        }

        services.osmose.loadErrorDetail(_error, (err, d) => {
            // No details to add if there are no associated issue elements
            if (!d.elems || d.elems.length === 0) return;

            // Things like keys and values are dynamically added to a subtitle string
            if (d.detail) {
                detailsDiv
                    .append('h4')
                    .attr('class', 'error-details-subtitle')
                    .text(() => t('QA.osmose.detail_title'))

                detailsDiv
                    .append('p')
                    .html(d => d.detail);
            }

            // Create list of linked issue elements
            elemsDiv
                .append('h4')
                .attr('class', 'error-details-subtitle')
                .text(() => t('QA.osmose.elems_title'));

            elemsDiv
                .append('ul')
                .attr('class', 'error-details-elements')
                .selectAll('.error_entity_link')
                .data(d.elems)
                .enter()
                .append('li')
                .append('a')
                .attr('class', 'error_entity_link')
                .text(d => d)
                .each(function() {
                    var link = d3_select(this);
                    var entityID = this.textContent;
                    var entity = context.hasEntity(entityID);

                    // Add click handler
                    link
                        .on('mouseenter', () => {
                            context.surface().selectAll(utilEntityOrMemberSelector([entityID], context.graph()))
                                .classed('hover', true);
                        })
                        .on('mouseleave', () => {
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

            // Don't hide entities related to this error - #5880
            context.features().forceVisible(d.elems);
            context.map().pan([0,0]);  // trigger a redraw
        });
    }


    osmoseDetails.error = (val) => {
        if (!arguments.length) return _error;
        _error = val;
        return osmoseDetails;
    };


    return osmoseDetails;
}