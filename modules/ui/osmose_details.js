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
    const s = services.osmose.getStrings(d.error_type);
    return (type in s) ? s[type] : unknown;
  }


  function osmoseDetails(selection) {
    const details = selection.selectAll('.error-details')
      .data(
        _error ? [_error] : [],
        d => `${d.id}-${d.status || 0}`
      );

    details.exit()
      .remove();

    const detailsEnter = details.enter()
      .append('div')
        .attr('class', 'error-details error-details-container');


    // Description
    const descriptionDiv = detailsEnter
      .append('div')
        .attr('class', 'error-details-subsection');

    descriptionDiv
      .append('h4')
        .text(() => t('QA.keepRight.detail_description'));

    descriptionDiv
      .append('p')
        .attr('class', 'error-details-description-text')
        .html(d => issueString(d, 'detail'));

    // Elements (populated later as data is requested)
    const detailsDiv = detailsEnter
      .append('div')
        .attr('class', 'error-details-subsection');

    const elemsDiv = detailsEnter
      .append('div')
        .attr('class', 'error-details-subsection');

    // Suggested Fix (musn't exist for every issue type)
    if (issueString(_error, 'fix') !== unknown) {
      let div = detailsEnter
        .append('div')
          .attr('class', 'error-details-subsection');

      div
        .append('h4')
          .text(() => t('QA.osmose.fix_title'));

      div
        .append('p')
          .html(d => issueString(d, 'fix'));
    }

    // Common Pitfalls (musn't exist for every issue type)
    if (issueString(_error, 'trap') !== unknown) {
      let div = detailsEnter
        .append('div')
          .attr('class', 'error-details-subsection');

      div
        .append('h4')
          .text(() => t('QA.osmose.trap_title'));

      div
        .append('p')
          .html(d => issueString(d, 'trap'));
    }

    detailsEnter
      .append('div')
        .attr('class', 'translation-link')
      .append('a')
        .attr('target', '_blank')
        .attr('rel', 'noopener noreferrer') // security measure
        .attr('href', 'https://www.transifex.com/openstreetmap-france/osmose')
        .text(() => t('QA.osmose.translation'))
      .append('svg')
        .attr('class', 'icon inline')
      .append('use')
        .attr('href', '#iD-icon-out-link');

    services.osmose.loadErrorDetail(_error)
      .then(d => {
        // No details to add if there are no associated issue elements
        if (!d.elems || d.elems.length === 0) return;

        // TODO: Do nothing if UI has moved on by the time this resolves

        // Things like keys and values are dynamically added to a subtitle string
        if (d.detail) {
          detailsDiv
            .append('h4')
              .attr('class', 'error-details-subtitle')
              .text(() => t('QA.osmose.detail_title'));

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
              const link = d3_select(this);
              const entityID = this.textContent;
              const entity = context.hasEntity(entityID);

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
                .on('click', () => {
                  d3_event.preventDefault();
                  const osmlayer = context.layers().layer('osm');
                  if (!osmlayer.enabled()) {
                    osmlayer.enabled(true);
                  }

                  context.map().centerZoom(d.loc, 20);

                  if (entity) {
                    context.enter(modeSelect(context, [entityID]));
                  } else {
                    context.loadEntity(entityID, () => {
                      context.enter(modeSelect(context, [entityID]));
                    });
                  }
                });

              // Replace with friendly name if possible
              // (The entity may not yet be loaded into the graph)
              if (entity) {
                let name = utilDisplayName(entity);  // try to use common name

                if (!name) {
                  const preset = context.presets().match(entity, context.graph());
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
      })
      .catch(err => {}); // TODO: Handle failed json request gracefully in some way
  }


  osmoseDetails.error = val => {
    if (!arguments.length) return _error;
    _error = val;
    return osmoseDetails;
  };


  return osmoseDetails;
}
