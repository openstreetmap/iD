import { event as d3_event } from 'd3-selection';

import { t } from '../locale';
import { krError } from '../../osm';

import { errorTypes } from './errorSchema.json';

// TODO: remove these objects, here for reference
var keepRightSchema = {
        'schema': '',
        'id': 0,
        'error_type': 0,
        'error_name': 0,
        'object_type': [
            'node',
            'way',
            'relation'
        ],
        'object_id': 0,
        'state': [
            'new',
            'reopened',
            'ignore_temporarily',
            'ignore'
        ],
        'first_occurrence': new Date(),
        'last_checked': new Date(),
        'object_timestamp': new Date(),
        'user_name': '',
        'lat': 0,
        'lon': 0,
        'comment': '',
        'comment_timestamp': new Date(),
        'msgid': '',
        'txt1': '',
        'txt2': '',
        'txt3': '',
        'txt4': '',
        'txt5': ''
    };

var keepRightSchemaFromWeb = {
    'error_type': '192',
    'object_type': 'way',
    'object_id': '339948768',
    'comment': null,
    'error_id': '92854860',
    'schema': '58',
    'description': 'This waterway intersects the highway #450282565',
    'title': 'intersections without junctions, highway-waterway'
};

export function parseErrorDescriptions(entity) {
    if (!(entity instanceof krError)) return;

    // find the matching template from the error schema
    var errorType = '_' + entity.error_type;
    var matchingTemplate = errorTypes.errors[errorType] || errorTypes.warnings[errorType];
    if (!matchingTemplate) return;

    var commonEntities = [
        'node',
        'way',
        'relation',
        'highway',
        'cycleway',
        'waterway',
        'riverbank'
    ]; // TODO: expand this list, or implement a different translation function

    function fillPlaceholder(d) { return '<span><a class="kr_error_description-id">' + d + '</a></span>'; }

    // regex pattern should capture groups to extract appropriate details
    var errorDescription = entity.description;
    var errorRe = new RegExp(matchingTemplate.description);

    var errorMatch = errorRe.exec(errorDescription);

    if (!errorMatch) {
        // TODO: Remove, for regex dev testing
        console.log('Unmatched:', errorType, errorDescription, errorRe);
        return;
    }

    var parsedDetails = {};
    var html_re = new RegExp(/<\/[a-z][\s\S]*>/);

    // index 0 is the whole match, groups start from 1
    for (var i = 1; i < errorMatch.length; i++) {
        var group = errorMatch[i];

        // IDs captured have an associated type
        if ('IDs' in matchingTemplate && matchingTemplate.IDs[i-1]) {
            var prefix = matchingTemplate.IDs[i-1];

            // wrap id with linking span if valid
            if (['n','w','r'].includes(prefix)) {
                group = fillPlaceholder(prefix + group);
            }
        } else if (html_re.test(group)) {
            // escape any html
            group = '\\' +  group + '\\';
        }

        // translate common words (e.g. node, way, relation)
        if (commonEntities.includes(group)) {
            group = t('QA.keepRight.entities.' + group);
        }

        parsedDetails['var' + i] = group;
    }

    return parsedDetails;
}


export function clickLink(context, id) {
        d3_event.preventDefault();
        context.layers().layer('osm').enabled(true);
        context.zoomToEntity(id);
    }
