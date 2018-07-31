import { krError } from '../../osm';
import { types } from './errorSchema.json';


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

export function utilGetErrorDetails(entity) {
    if (!(entity instanceof krError)) return;

    // find the matching template from the error schema
    var errorType = '_' + entity.error_type;
    var matchingTemplate = types.errors[errorType] || types.warnings[errorType];
    if (!matchingTemplate) return;

    // tokenize descriptions
    var errorDescriptions = entity.description.split(' ');
    var schemaDescriptions = matchingTemplate.description.split(' ');


    function iterator() {

        var parsedDescription = [];
        var re = new RegExp(/{\$[0-9]}/);

        schemaDescriptions.forEach(function(word, index) { // TODO: figure out how to get the word and the index in a foreach
            if (!re.test(word)) return;

            // get the word at this index, and at the next index value
            var nextWord = schemaDescriptions[index + 1] ? schemaDescriptions[index + 1] : null;

            // also get the word at the same index from the errorDescription

            var parsedPhrase = '';


            // while error terms do not equal the next schema term
            for (var i = index; i <= errorDescriptions.length - 1;  i++) {
                if (errorDescriptions[i] !== nextWord) {
                    parsedPhrase += errorDescriptions[i];
                }
                parsedDescription.push(parsedPhrase);
                break;
            }
        });
    }


    function getCommonWords() { // TODO: implement, see if a variable is a common word like 'node', so that we can translate it before sending it off
    }


    iterator();
}