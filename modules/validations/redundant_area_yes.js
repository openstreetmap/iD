import { actionChangeTags } from '../actions/change_tags';
import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';
import { osmTagSuggestingArea } from '../osm/tags';

/**
 * Flag ways that have area=yes when other tags already imply area geometry.
 * See https://github.com/openstreetmap/iD/issues/9260
 * Redundant area=yes is often flagged by QA tools (e.g. OSMI).
 */
export function validationRedundantAreaYes(/* context */) {
  const type = 'redundant_area_yes';

  const validation = function checkRedundantAreaYes(entity /* , graph */) {
    if (entity.type !== 'way') return [];
    if (entity.tags.area !== 'yes') return [];
    if (!entity.isArea()) return [];  // closed way or otherwise treated as area

    const tagsWithoutArea = Object.assign({}, entity.tags);
    delete tagsWithoutArea.area;

    // If other tags already imply area, area=yes is redundant
    const suggestingArea = osmTagSuggestingArea(tagsWithoutArea);
    if (!suggestingArea) return [];

    return [
      new validationIssue({
        type: type,
        severity: 'warning',
        message: function (context) {
          const entity = context.hasEntity(this.entityIds[0]);
          return entity ? t.append('issues.redundant_area_yes.message', {
            feature: utilDisplayLabel(entity, context.graph())
          }) : '';
        },
        reference: (selection) => {
          selection.selectAll('.issue-reference')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'issue-reference')
            .call(t.append('issues.redundant_area_yes.reference'));
        },
        entityIds: [entity.id],
        dynamicFixes: () => [
          new validationIssueFix({
            icon: 'iD-operation-delete',
            title: t.append('issues.fix.remove_named_tag.title', { tag: 'area' }),
            onClick: function (context) {
              const entityId = this.issue.entityIds[0];
              const entity = context.entity(entityId);
              const tags = Object.assign({}, entity.tags);
              delete tags.area;
              context.perform(
                actionChangeTags(entityId, tags),
                t('issues.fix.remove_named_tag.annotation', { tag: 'area' })
              );
            }
          })
        ]
      })
    ];
  };

  validation.type = type;
  return validation;
}
