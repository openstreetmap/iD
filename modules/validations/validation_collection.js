import { utilStringQs } from '../util';
import { text as d3_text } from 'd3-request';
import mapcssParse from 'mapcss-parse/source/index';

export function validationCollection() {
    var validations = {};
    validations.init = function (callback) { 
        var validationsUrl = utilStringQs(window.location.hash)['validations'];
        d3_text(validationsUrl, function(err, mapcss) {
            if (err) return;
            callback(mapcssParse(mapcss));            
        });
    };

    return validations; 
}