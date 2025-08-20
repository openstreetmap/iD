import { t } from '../core/localizer';
import { operationDelete } from '../operations';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';
import { actionChangeTags } from '../actions';
import { isDashSensitiveKey } from '../osm/tags';
export function validationDashes() {
    var type = 'invalid_dashes';

    var validation = function (entity) {
        var issues = [];
        function showReferenceDash(selection) {
            selection
                .selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.invalid_dashes.reference'));
        }

        // Regex for all non-standard dashes and similar characters
        //  ~        → Tilde, sometimes mistaken for a dash
        //  \u2010   → Hyphen (‐)
        //  \u2011   → Non-breaking hyphen
        //  \u2012   → Figure dash (‒)
        //  \u2013   → En dash (–)
        //  \uFE58   → Small em dash (﹘)
        //  \u06D4   → Arabic full stop (۔)
        //  \u2043   → Hyphen bullet (⁃)
        //  \u02D7   → Modifier letter minus sign (˗)
        //  \u2212   → Mathematical minus sign (−)
        //  \u2796   → Heavy minus sign (➖)
        //  \u2CBA   → Coptic capital letter sampi (Ⲻ),
        //  \u2014   → EM DASH (—)

        var invalidDashRegex =
            /[~\u2010\u2011\u2012\u2013\uFE58\u06D4\u2043\u02D7\u2212\u2796\u2CBA\u2014]/g;
        function replaceInvalidDashesOutsideComments(text) {
            let result = '';
            let insideQuotes = false;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === '"') {
                    insideQuotes = !insideQuotes;
                    result += char;
                } else if (!insideQuotes && invalidDashRegex.test(char)) {
                    result += '-';
                } else {
                    result += char;
                }
            }
            return result;
        }

        function containsInvalidDashOutsideComments(text) {
            return text !== replaceInvalidDashesOutsideComments(text);
        }
        if (entity.tags) {
            var badTags = [];

            Object.entries(entity.tags).forEach(([key, value]) => {
                if (typeof value !== 'string') return;
                if (!isDashSensitiveKey(key)) return;
                if (containsInvalidDashOutsideComments(value)) {
                    badTags.push({ key, value });
                }
            });

            if (badTags.length) {
                issues.push(
                    new validationIssue({
                        type: type,
                        subtype: 'nonstandard_dash',
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
                        reference: showReferenceDash,
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
                                        'issues.fix.replace_dashes.title'
                                    ),
                                    onClick: function (context) {
                                        var id = this.issue.entityIds[0];
                                        var entity = context.hasEntity(id);
                                        if (!entity) return;

                                        const tags = { ...entity.tags };
                                        let changed = false;

                                        badTags.forEach(({ key, value }) => {
                                            let newValue =
                                                replaceInvalidDashesOutsideComments(
                                                    value
                                                );
                                            if (newValue !== value) {
                                                tags[key] = newValue;
                                                changed = true;
                                            }
                                        });

                                        if (changed) {
                                            context.perform(
                                                actionChangeTags(id, tags),
                                                t(
                                                    'issues.fix.replace_dashes.annotation'
                                                )
                                            );
                                        }
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
                            .map((d) => `${d.key}=${d.value}`)
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
