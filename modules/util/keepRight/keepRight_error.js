import { event as d3_event } from 'd3-selection';

import { t } from '../locale';
import { krError } from '../../osm';

import { errorTypes } from './errorSchema.json';
import { parseError } from './parse_error';


export function parseErrorDescriptions(entity) {
    var parsedDetails = {};
    var html_re = new RegExp(/<\/[a-z][\s\S]*>/);
    var commonEntities = [
        'node',
        'way',
        'relation',
        'highway',
        'cycleway',
        'waterway',
        'riverbank'
    ]; // TODO: expand this list, or implement a different translation function

    var errorType;
    var errorTemplate;
    var errorDescription;
    var errorRegex;
    var errorMatch;

    if (!(entity instanceof krError)) return;

    // find the matching template from the error schema
    errorType = '_' + entity.error_type;
    errorTemplate = errorTypes.errors[errorType] || errorTypes.warnings[errorType];
    if (!errorTemplate) return;

    // some descriptions are just fixed text
    if (!('regex' in errorTemplate)) return;

    // regex pattern should match description with variable details captured as groups
    errorDescription = entity.description;
    errorRegex = new RegExp(errorTemplate.description);
    errorMatch = errorRegex.exec(errorDescription);
    if (!errorMatch) {
        // TODO: Remove, for regex dev testing
        console.log('Unmatched:', errorType, errorDescription, errorRegex);
        return;
    }

    errorMatch.forEach(function(group, index) {
        var idType;

        // index 0 is the whole match, skip it
        if (!index) return;

        // link IDs if present in the group
        idType = 'IDs' in errorTemplate ? errorTemplate.IDs[index-1] : '';
        if (idType && group) {
            group = parseError(group, idType);
        } else if (html_re.test(group)) {
            // escape any html in non-IDs
            group = '\\' +  group + '\\';
        }

        // translate common words (e.g. node, way, relation)
        if (commonEntities.includes(group)) {
            group = t('QA.keepRight.entities.' + group);
        }

        parsedDetails['var' + index] = group;
    });

    return parsedDetails;
}


export function clickLink(context, id) {
        d3_event.preventDefault();
        context.layers().layer('osm').enabled(true);
        context.zoomToEntity(id);
    }
