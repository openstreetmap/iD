import { actionChangeTags } from '../actions/change_tags';
import { t } from '../core/localizer';
import { utilTagDiff } from '../util';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationPrivateData() {
    const type = 'private_data';

    // assume that some buildings are private
    const privateBuildingValues = {
        detached: true,
        farm: true,
        house: true,
        houseboat: true,
        residential: true,
        semidetached_house: true,
        static_caravan: true
    };

    // but they might be public if they have one of these other tags
    const publicKeys = {
        amenity: true,
        craft: true,
        historic: true,
        leisure: true,
        office: true,
        shop: true,
        tourism: true
    };

    // these tags may contain personally identifying info
    const personalTags = {
        'contact:email': true,
        'contact:fax': true,
        'contact:phone': true,
        email: true,
        fax: true,
        phone: true
    };


    const validation = function checkPrivateData(entity) {
        const tags = entity.tags;
        if (!tags.building || !privateBuildingValues[tags.building]) return [];

        const keepTags = {};
        for (const k in tags) {
            if (publicKeys[k]) return [];  // probably a public feature
            if (!personalTags[k]) {
                keepTags[k] = tags[k];
            }
        }

        const tagDiff = utilTagDiff(tags, keepTags);
        if (!tagDiff.length) return [];

        const fixID = tagDiff.length === 1 ? 'remove_tag' : 'remove_tags';

        return [new validationIssue({
            type: type,
            severity: 'warning',
            message: showMessage,
            reference: showReference,
            entityIds: [entity.id],
            dynamicFixes: function() {
                return [
                    new validationIssueFix({
                        icon: 'iD-operation-delete',
                        title: t.append('issues.fix.' + fixID + '.title'),
                        onClick: function(context) {
                            context.perform(doUpgrade, t('issues.fix.remove_tag.annotation'));
                        }
                    })
                ];
            }
        })];


        function doUpgrade(graph) {
            const currEntity = graph.hasEntity(entity.id);
            if (!currEntity) return graph;

            const newTags = Object.assign({}, currEntity.tags);  // shallow copy
            tagDiff.forEach(function(diff) {
                if (diff.type === '-') {
                    delete newTags[diff.key];
                } else if (diff.type === '+') {
                    newTags[diff.key] = diff.newVal;
                }
            });

            return actionChangeTags(currEntity.id, newTags)(graph);
        }


        function showMessage(context) {
            const currEntity = context.hasEntity(this.entityIds[0]);
            if (!currEntity) return '';

            return t.append('issues.private_data.contact.message',
                { feature: utilDisplayLabel(currEntity, context.graph()) }
            );
        }


        function showReference(selection) {
            const enter = selection.selectAll('.issue-reference')
                .data([0])
                .enter();

            enter
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.private_data.reference'));

            enter
                .append('strong')
                .call(t.append('issues.suggested'));

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
                    const klass = d.type === '+' ? 'add' : 'remove';
                    return 'tagDiff-cell tagDiff-cell-' + klass;
                })
                .html(function(d) { return d.display; });
        }
    };


    validation.type = type;

    return validation;
}
