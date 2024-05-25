import { actionChangeTags } from '../actions/change_tags';
import { t } from '../core/localizer';
import { validationIssue, validationIssueFix } from '../core/validation';
import { utilDisplayLabel } from '../util';


export function validationOneLaneWithNoOneway() {
  const type = 'oneway_onelane';

  /** @param {string} onewayValue  @param {osmEntity} entity */
  function createSuggestion(onewayValue, entity) {
    return new validationIssueFix({
      icon: 'iD-icon-data',
      title: t.append(`issues.fix.tag_as_oneway_${onewayValue}.title`),
      onClick: (context) => {
        const newTags = { ...entity.tags, oneway: onewayValue };
        context.perform(
          actionChangeTags(entity.id, newTags), t(`issues.fix.tag_as_oneway_${onewayValue}.annotation`)
        );
      }
    });
  }

  /** @param {osmEntity} entity */
  function makeOneLaneIssue(entity) {
    return new validationIssue({
      type,
      subtype: type,
      severity: 'warning',
      message: (context) => t.append(
        'issues.oneway_onelane.message',
        { feature: utilDisplayLabel(entity, context.graph()) }
      ),
      reference: showReference,
      entityIds: [entity.id],
      hash: type,
      dynamicFixes: () => [
        // suggest adding `oneway` tag (automatic)
        ...['yes', 'alternating'].map(onewayValue => createSuggestion(onewayValue, entity)),

        // or changing the `lanes` tag (manual)
        new validationIssueFix({ title: t.append('issues.fix.change_lane_tag.title') })
      ]
    });
  }


  function showReference(selection) {
    selection.selectAll('.issue-reference')
      .data([0])
      .enter()
      .append('div')
      .attr('class', 'issue-reference')
      .call(t.append(`issues.${type}.reference`));
  }

  /** @param {osmEntity} entity */
  const validation = (entity) => {
    const isOneLane = entity.tags.lanes === '1';

    if (
      entity.type !== 'way' ||
      entity.isOneWay() ||
      !isOneLane ||
      entity.tags.leisure === 'slipway'
    ) return [];

    // this line has lanes=1, but is not oneway. This makes no sense.
    return [makeOneLaneIssue(entity)];
  };


  validation.type = type;

  return validation;
}
