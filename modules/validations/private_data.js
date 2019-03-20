import _clone from 'lodash-es/clone';

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
    var okayModifierKeys = {
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

    function privateDataKeys(entity) {
        var tags = entity.tags;
        if (!tags.building || !privateBuildingValues[tags.building]) return [];
        var privateKeys = [];
        for (var key in tags) {
            if (okayModifierKeys[key]) return [];
            if (personalTags[key]) privateKeys.push(key);
        }
        return privateKeys;
    }

    var validation = function(entity, context) {

        var privateKeys = privateDataKeys(entity);

        if (privateKeys.length === 0) return [];

        var fixID = privateKeys.length === 1 ? 'remove_tag' : 'remove_tags';
        return [new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.private_data.contact.message', {
                feature: utilDisplayLabel(entity, context),
            }),
            tooltip: t('issues.private_data.tip'),
            entities: [entity],
            info: { privateKeys: privateKeys },
            fixes: [
                new validationIssueFix({
                    icon: 'iD-operation-delete',
                    title: t('issues.fix.' + fixID + '.title'),
                    onClick: function() {
                        var entity = this.issue.entities[0];
                        var tags = _clone(entity.tags);
                        var privateKeys = this.issue.info.privateKeys;
                        for (var index in privateKeys) {
                            delete tags[privateKeys[index]];
                        }
                        context.perform(
                            actionChangeTags(entity.id, tags),
                            t('issues.fix.remove_private_info.annotation')
                        );
                    }
                })
            ]
        })];
    };

    validation.type = type;

    return validation;
}
