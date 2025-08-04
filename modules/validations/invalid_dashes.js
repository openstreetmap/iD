import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue } from '../core/validation';
export function validationDashes() {
    var type = 'invalid_dashes';

    var validation = function (entity) {
        var issues = []
        function showReferenceDash(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.invalid_dashes.reference'));
        }
    
    // Regex for all non-standard dashes and similar characters
var invalidDashRegex = /[~\u2010\u2011\u2012\u2013\uFE58\u06D4\u2043\u02D7\u2212\u2796\u2CBA]/;

        function containsInvalidDash(text) {
            return invalidDashRegex.test(text);
        }
        if (entity.tags) {
            var badTags = [];

            Object.entries(entity.tags).forEach(([key, value]) => {
                if (typeof value !== 'string') return;

                if (containsInvalidDash(value)) {
                    badTags.push({ key, value });
                }
            });

            if (badTags.length) {
                issues.push(new validationIssue({
                    type: type,
                    subtype: 'nonstandard_dash',
                    severity: 'error',
                    message: function(context) {
                        var entity = context.hasEntity(this.entityIds[0]);
                        return entity ? t.append(`issues.${type}.message${this.data}`, {
                            feature:utilDisplayLabel(entity,context.graph()),
                        }) : '';
                    },
                    reference:showReferenceDash,
                    entityIds: [entity.id],
                    hash: badTags.map(d => `${d.key}=${d.value}`).join('|'),
                    data: badTags.length > 1 ? '_multi' : ''
                }));
            } 
        }
        return issues;
        
    }
    validation.type = type;
    return validation;


}