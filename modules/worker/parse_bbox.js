import { xml as d3_xml } from 'd3-request';
import { parser } from 'idly-faster-osm-parser';
import ohauth from 'ohauth';

var isWorker =
    typeof WorkerGlobalScope !== 'undefined' &&
    self instanceof WorkerGlobalScope;

if (!isWorker) {
    throw new Error('this function can only be executed inside Web Worker');
}

export function workerParseBbox(url, done) {
    requestRawXml(url, function(error, xml) {
        if (error) {
            return done(error);
        }
        done(null, processRawXml(xml));
    });
}

export function workerAuthdParseBbox(xhrParams, done) {
    var params = xhrParams;
    params.push(callback);

    ohauth.xhr.apply(ohauth, params);

    function callback(error, data) {
        if (error) {
            return done(error);
        }
        done(null, processRawXml(data.responseText));
    }
}

function requestRawXml(url, done) {
    return d3_xml(url)
        .mimeType('text/plain')
        .response(function(xhr) {
            return xhr.responseText;
        })
        .get(done);
}

function processRawXml(xmlText) {
    return parser(xmlText).map(r => {
        Object.assign(
            r,
            r.attributes,
            r.loc ? { loc: [r.loc.lon, r.loc.lat] } : undefined
        );
        delete r.attributes;
        delete r.type;
        return r;
    });
}
