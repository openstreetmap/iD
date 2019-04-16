import { actionChangeTags } from '../actions';
import { t } from '../util/locale';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationPrivateData() {
    var type = 'private_data';

    // assume that some buildings are private
    var privateBuildingValues = {
        detached: true,
        farm: true,
        house: true,
        residential: true,
        semidetached_house: true,
        static_caravan: true
    };

    // but they might be public if they have one of these other tags
    var publicKeys = {
        amenity: true,
        craft: true,
        historic: true,
        leisure: true,
        shop: true,
        tourism: true
    };

    // these tags may contain personally identifying info
    var personalTags = {
        'contact:email': true,
        'contact:fax': true,
        'contact:phone': true,
        'contact:website': true,
        email: true,
        fax: true,
        phone: true,
        website: true
    };


    var validation = function checkPrivateData(entity, context) {
        var tags = entity.tags;
        var keepTags = {};
        var tagDiff = [];
        if (!tags.building || !privateBuildingValues[tags.building]) return [];

        for (var k in tags) {
            if (publicKeys[k]) return [];  // probably a public feature

            if (personalTags[k]) {
                tagDiff.push('- ' + k + '=' + tags[k]);
            } else {
                keepTags[k] = tags[k];
            }
        }

        if (!tagDiff.length) return [];

        var fixID = tagDiff.length === 1 ? 'remove_tag' : 'remove_tags';

        return [new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.private_data.contact.message', {
                feature: utilDisplayLabel(entity, context),
            }),
            reference: showReference,
            entities: [entity],
            data: {
                newTags: keepTags
            },
            fixes: [
                new validationIssueFix({
                    icon: 'iD-operation-delete',
                    title: t('issues.fix.' + fixID + '.title'),
                    onClick: function() {
                        var entityID = this.issue.entities[0].id;
                        var newTags = this.issue.data.newTags;
                        context.perform(
                            actionChangeTags(entityID, newTags),
                            t('issues.fix.upgrade_tags.annotation')
                        );
                    }
                })
            ]
        })];


        function showReference(selection) {
            var enter = selection.selectAll('.issue-reference')
                .data([0])
                .enter();

            enter
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.private_data.tip'));

            enter
                .append('strong')
                .text(t('issues.suggested'));

            enter
                .append('table')
                .attr('class', 'tagDiff-table')
                .selectAll('.tagDiff-row')
                .data(tagDiff)
                .enter()
                .append('tr')
                .attr('class', 'tagDiff-row')
                .append('td')
                .attr('class', function(d) {
                    var klass = d.charAt(0) === '+' ? 'add' : 'remove';
                    return 'tagDiff-cell tagDiff-cell-' + klass;
                })
                .text(function(d) { return d; });
        }
    };


    validation.type = type;

    return validation;
}
