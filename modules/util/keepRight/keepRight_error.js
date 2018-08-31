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

    var _220 = false;
    var _splitVar2;
    var _splitVar3;
    var _401 = false;

    // find the matching template from the error schema
    var errorType = '_' + entity.error_type;
    var matchingTemplate = errorTypes.errors[errorType] || errorTypes.warnings[errorType];
    if (!matchingTemplate) return;

    // handle special cases
    // error _170
    if (errorType === '_170') { return { var1: entity.description }; }

    // error _220
    if (errorType === '_220')  { _220 = true; }

    if (errorType === '_401') { _401 = true; }

    // tokenize descriptions
    var errorDescription = entity.description.split(' ');
    var templateDescription = matchingTemplate.description.split(' ');

    var parsedDescriptions = [];
    var variable_re = new RegExp(/{\$[0-9]}/);
    var html_re = new RegExp(/<\/[a-z][\s\S]*>/);
    var span_re = new RegExp(/<\/span>/);
    var digit_re = new RegExp(/^\d+$/);

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

    function getEntityBase(lastWord) {

        var result;
        commonEntities.forEach(function(entity) {
            if (entity.includes(lastWord)) { result = entity; }
            return;
        });

        if (result) {
            return result.includes('node') ? 'n' :
                result.includes('way') ? 'w' :
                result.includes('relation') ? 'r' : null;

        }
         // special handling for error _401
        else if (_401 && parsedDescriptions[0]) { return 'w'; } // hacky check to see if var1 id is entered
        return result;
    }

    function isID(word, i) {
        // select just numeric part of id
        if (word.charAt(0) === '#' || errorDescription[i-1] === '(id') { // NOTE: hacky way of selecting the token before
            return word.replace(/\D/g,'');
        }
        // if it's just an id (e.g., error _401)
        else if (digit_re.test(word) && _401) { return word; }
        return false;
    }

    function getIDType(i) {
        var lastWord = errorDescription[i-1];
        var secondLastWord = errorDescription[i-2];
        if (lastWord) { return getEntityBase(lastWord) || getEntityBase(lastWord.slice(0, -1)) || getEntityBase(secondLastWord); }

        return getEntityBase(parsedDescriptions.slice(-1)[0].split(' ').slice(-1)[0]);
    }

    templateDescription.forEach(function(word, index) {
        if (!variable_re.test(word)) return;

        // get the word at this index, and at the next index value
        var nextWord = templateDescription[index + 1] ? templateDescription[index + 1] : null;

        var parsedPhrase = '';

        // parse error description words
        for (var i = index; i <= errorDescription.length - 1;  i++) {
            if (errorDescription[i] !== nextWord) {
                var currWord = errorDescription[i];

                // if the word is an id, clean and link it
                if (isID(currWord, i)) {
                    // get the entity type of the id
                    var base = getIDType(i);
                    // wrap id with linking span
                    currWord = fillPlaceholder(base + currWord);
                }

                // if any variables contain common words, like node, way, relation, translate those
                if (commonEntities.includes(currWord)) {
                    currWord = t('QA.keepRight.entities.' + currWord);
                }

                // special handling for error _220
                if (_220 && index === 4) {
                    _splitVar2 = currWord.split('=')[0];
                    _splitVar3 = currWord.split('=')[1];
                    parsedDescriptions.push(_splitVar2);
                    parsedDescriptions.push(_splitVar3);
                    break;
                }

                // add phrase (or single word) to variable list
                parsedPhrase += currWord;
            }
            // if any variables have html (excluding spans which are added ^), escape them
            if (html_re.test(parsedPhrase) && !span_re.test(parsedPhrase)) {
                parsedPhrase = '\\' +  parsedPhrase + '\\';
            }
            parsedDescriptions.push(parsedPhrase);
            break;
        }
    });

    return {
        var1: parsedDescriptions[0] || '',
        var2: parsedDescriptions[1] || '',
        var3: parsedDescriptions[2] || '',
        var4: parsedDescriptions[3] || '',
        var5: parsedDescriptions[4] || '',
        var6: parsedDescriptions[5] || '',
    };
}


export function clickLink(context, id) {
        d3_event.preventDefault();
        context.layers().layer('osm').enabled(true);
        context.zoomToEntity(id);
    }
