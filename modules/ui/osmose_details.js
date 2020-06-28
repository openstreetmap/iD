import {
  event as d3_event,
  select as d3_select
} from 'd3-selection';

import { presetManager } from '../presets';
import { modeSelect } from '../modes/select';
import { t } from '../core/localizer';
import { services } from '../services';
import { utilDisplayName, utilHighlightEntities } from '../util';


export function uiOsmoseDetails(context) {
  let _qaItem;

  function issueString(d, type) {
    if (!d) return '';

    // Issue strings are cached from Osmose API
    const s = services.osmose.getStrings(d.itemType);
    return (type in s) ? s[type] : '';
  }


  function osmoseDetails(selection) {
    const details = selection.selectAll('.error-details')
      .data(
        _qaItem ? [_qaItem] : [],
        d => `${d.id}-${d.status || 0}`
      );

    details.exit()
      .remove();

    const detailsEnter = details.enter()
      .append('div')
        .attr('class', 'error-details qa-details-container');


    // Description
    if (issueString(_qaItem, 'detail')) {
      const div = detailsEnter
        .append('div')
          .attr('class', 'qa-details-subsection');

      div
        .append('h4')
          .text(() => t('QA.keepRight.detail_description'));

      div
        .append('p')
          .attr('class', 'qa-details-description-text')
          .html(d => issueString(d, 'detail'))
        .selectAll('a')
          .attr('rel', 'noopener')
          .attr('target', '_blank');
    }

    // Elements (populated later as data is requested)
    const detailsDiv = detailsEnter
      .append('div')
        .attr('class', 'qa-details-subsection');

    const elemsDiv = detailsEnter
      .append('div')
        .attr('class', 'qa-details-subsection');

    // Suggested Fix (mustn't exist for every issue type)
    if (issueString(_qaItem, 'fix')) {
      const div = detailsEnter
        .append('div')
          .attr('class', 'qa-details-subsection');

      div
        .append('h4')
          .text(() => t('QA.osmose.fix_title'));

      div
        .append('p')
          .html(d => issueString(d, 'fix'))
        .selectAll('a')
          .attr('rel', 'noopener')
          .attr('target', '_blank');
    }

    // Common Pitfalls (mustn't exist for every issue type)
    if (issueString(_qaItem, 'trap')) {
      const div = detailsEnter
        .append('div')
          .attr('class', 'qa-details-subsection');

      div
        .append('h4')
          .text(() => t('QA.osmose.trap_title'));

      div
        .append('p')
          .html(d => issueString(d, 'trap'))
        .selectAll('a')
          .attr('rel', 'noopener')
          .attr('target', '_blank');
    }

    // Save current item to check if UI changed by time request resolves
    const thisItem = _qaItem;
    services.osmose.loadIssueDetail(_qaItem)
      .then(d => {
        // No details to add if there are no associated issue elements
        if (!d.elems || d.elems.length === 0) return;

        // Do nothing if UI has moved on by the time this resolves
        if (
          context.selectedErrorID() !== thisItem.id
          && context.container().selectAll(`.qaItem.osmose.hover.itemId-${thisItem.id}`).empty()
        ) return;

        // Things like keys and values are dynamically added to a subtitle string
        if (d.detail) {
          detailsDiv
            .append('h4')
              .text(() => t('QA.osmose.detail_title'));

          detailsDiv
            .append('p')
              .html(d => d.detail)
            .selectAll('a')
              .attr('rel', 'noopener')
              .attr('target', '_blank');
        }

        // Create list of linked issue elements
        elemsDiv
          .append('h4')
            .text(() => t('QA.osmose.elems_title'));

        elemsDiv
          .append('ul').selectAll('li')
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
                  utilHighlightEntities([entityID], true, context);
                })
                .on('mouseleave', () => {
                  utilHighlightEntities([entityID], false, context);
                })
                .on('click', () => {
                  d3_event.preventDefault();

                  utilHighlightEntities([entityID], false, context);

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
                  const preset = presetManager.match(entity, context.graph());
                  name = preset && !preset.isFallback() && preset.name();  // fallback to preset name
                }

                if (name) {
                  this.innerText = name;
                }
              }
            });

        // Don't hide entities related to this issue - #5880
        context.features().forceVisible(d.elems);
        context.map().pan([0,0]);  // trigger a redraw
      })
      .catch(err => {
        console.log(err); // eslint-disable-line no-console
      });
  }


  osmoseDetails.issue = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return osmoseDetails;
  };


  return osmoseDetails;
}
