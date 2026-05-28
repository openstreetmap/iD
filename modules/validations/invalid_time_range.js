import { t } from '../core/localizer';
import { operationDelete } from '../operations';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';
import { actionChangeTags } from '../actions';
import { needsTimeRangeValidation } from '../osm/tags';
import opening_hours from 'opening_hours';

export function validationTimeRange() {
    var type = 'invalid_time_range';

    var validation = function (entity) {
        var issues = [];
        if (!entity.tags) return;
        function showReferenceTimeRange(selection) {
            selection
                .selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.invalid_time_range.reference'));
        }

        if (entity.tags) {
            var badTags = [];

            Object.entries(entity.tags).forEach(([key, value]) => {
                if (typeof value !== 'string') return;
                if (!needsTimeRangeValidation(key)) return;
                try {
                    var hours = new opening_hours(value, {}, { mode: 2 });
                    if (
                        hours.getWarnings().length > 0 &&
                        hours.prettifyValue() !== value
                    ) {
                        badTags.push({
                            key: key,
                            prettified: hours.prettifyValue(),
                        });
                    }
                } catch  {
                    return;
                }

            });

            if (badTags.length) {
                issues.push(
                    new validationIssue({
                        type: type,
                        subtype: 'invalid_time_range_syntax',
                        severity: 'error',
                        message: function (context) {
                            var entity = context.hasEntity(this.entityIds[0]);
                            return entity
                                ? t.append(
                                      `issues.${type}.message${this.data}`,
                                      {
                                          feature: utilDisplayLabel(
                                              entity,
                                              context.graph()
                                          ),
                                      }
                                  )
                                : '';
                        },
                        reference: showReferenceTimeRange,
                        entityIds: [entity.id],
                        dynamicFixes: function (context) {
                            var fixes = [];
                            var deleteOnClick;
                            var id = this.entityIds[0];
                            var operation = operationDelete(context, [id]);
                            var disabledReasonID = operation.disabled();
                            if (!disabledReasonID) {
                                deleteOnClick = function (context) {
                                    var id = this.issue.entityIds[0];
                                    var operation = operationDelete(context, [
                                        id,
                                    ]);
                                    if (!operation.disabled()) {
                                        operation();
                                    }
                                };
                            }
                            fixes.push(
                                new validationIssueFix({
                                    icon: 'iD-icon-wrench',
                                    title: t.append(
                                        'issues.fix.fix_time_range.title'
                                    ),
                                    onClick: function (context) {
                                        var id = this.issue.entityIds[0];
                                        var entity = context.hasEntity(id);
                                        if (!entity) return;

                                        const tags = { ...entity.tags };

                                        badTags.forEach(
                                            ({ key, prettified }) => {
                                                tags[key] = prettified;
                                            }
                                        );

                                        context.perform(
                                            actionChangeTags(id, tags),
                                            t(
                                                'issues.fix.fix_time_range.annotation'
                                            )
                                        );
                                    },
                                })
                            );

                            fixes.push(
                                new validationIssueFix({
                                    icon: 'iD-operation-delete',
                                    title: t.append(
                                        'issues.fix.delete_feature.title'
                                    ),
                                    disabledReason: disabledReasonID
                                        ? t(
                                              'operations.delete.' +
                                                  disabledReasonID +
                                                  '.single'
                                          )
                                        : undefined,
                                    onClick: deleteOnClick,
                                })
                            );

                            return fixes;
                        },
                        hash: badTags
                            .map((d) => `${d.key}=${d.prettified}`)
                            .join('|'),

                        data: badTags.length > 1 ? '_multi' : '',
                    })
                );
            }
        }
        return issues;
    };
    validation.type = type;
    return validation;
}
