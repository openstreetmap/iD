import {
  event as d3_event,
  select as d3_select
} from 'd3-selection';

import { presetManager } from '../presets';
import { modeSelect } from '../modes/select';
import { t } from '../core/localizer';
import { utilDisplayName, utilHighlightEntities, utilEntityRoot } from '../util';

export function uiImproveOsmDetails(context) {
  let _qaItem;


  function issueDetail(d) {
    if (d.desc) return d.desc;
    const issueKey = d.issueKey;
    d.replacements = d.replacements || {};
    d.replacements.default = t('inspector.unknown');  // special key `default` works as a fallback string
    return t(`QA.improveOSM.error_types.${issueKey}.description`, d.replacements);
  }


  function improveOsmDetails(selection) {
    const details = selection.selectAll('.error-details')
      .data(
        (_qaItem ? [_qaItem] : []),
        d => `${d.id}-${d.status || 0}`
      );

    details.exit()
      .remove();

    const detailsEnter = details.enter()
      .append('div')
        .attr('class', 'error-details qa-details-container');


    // description
    const descriptionEnter = detailsEnter
      .append('div')
        .attr('class', 'qa-details-subsection');

    descriptionEnter
      .append('h4')
        .text(() => t('QA.keepRight.detail_description'));

    descriptionEnter
      .append('div')
        .attr('class', 'qa-details-description-text')
        .html(issueDetail);

    // If there are entity links in the error message..
    let relatedEntities = [];
    descriptionEnter.selectAll('.error_entity_link, .error_object_link')
      .each(function() {
        const link = d3_select(this);
        const isObjectLink = link.classed('error_object_link');
        const entityID = isObjectLink ?
          (utilEntityRoot(_qaItem.objectType) + _qaItem.objectId)
          : this.textContent;
        const entity = context.hasEntity(entityID);

        relatedEntities.push(entityID);

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

            context.map().centerZoom(_qaItem.loc, 20);

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

          if (!name && !isObjectLink) {
            const preset = presetManager.match(entity, context.graph());
            name = preset && !preset.isFallback() && preset.name();  // fallback to preset name
          }

          if (name) {
            this.innerText = name;
          }
        }
      });

    // Don't hide entities related to this error - #5880
    context.features().forceVisible(relatedEntities);
    context.map().pan([0,0]);  // trigger a redraw
  }

  improveOsmDetails.issue = function(val) {
    if (!arguments.length) return _qaItem;
    _qaItem = val;
    return improveOsmDetails;
  };

  return improveOsmDetails;
}
