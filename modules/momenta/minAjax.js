import { JXON } from '../util/jxon';
function initXMLhttp() {
    var xmlhttp1 = null;
    if (window.XMLHttpRequest) {
        //code for IE7,firefox chrome and above
        xmlhttp1 = new XMLHttpRequest();
    } else {
        //code for Internet Explorer
        xmlhttp1 = new ActiveXObject('Microsoft.XMLHTTP');
    }

    return xmlhttp1;
}

function minAjax(config) {

    /*Config Structure
            url:"reqesting URL"
            type:"GET or POST"
            method: "(OPTIONAL) True for async and False for Non-async | By default its Async"
            debugLog: "(OPTIONAL)To display Debug Logs | By default it is false"
            data: "(OPTIONAL) another Nested Object which should contains reqested Properties in form of Object Properties"
            success: "(OPTIONAL) Callback function to process after response | function(data,status)"
    */

    if (!config.url) {

        if (config.debugLog === true)
            console.log('No Url!');
        return;

    }

    if (!config.type) {

        if (config.debugLog === true)
            console.log('No Default type (GET/POST) given!');
        return;

    }

    if (config.method) {
        config.method = true;
    } else {
        config.method = false;
    }


    if (!config.debugLog) {
        config.debugLog = false;
    }

    var xmlhttp2 = initXMLhttp();
    var result='';
    xmlhttp2.onreadystatechange = function() {

        if (xmlhttp2.readyState === 4 && xmlhttp2.status === 200) {

            result = xmlhttp2.responseText
            // alert(result)
            if (config.success) {
                config.success(xmlhttp2.responseText, xmlhttp2.readyState);
            }

            if (config.debugLog === true)
                console.log('SuccessResponse');
            if (config.debugLog === true)
                console.log('Response Data:' + xmlhttp2.responseText);

        } else {

            if (config.debugLog === true)
                console.log('FailureResponse --> State:' + xmlhttp2.readyState + 'Status:' + xmlhttp2.status);
        }
    };

    var sendString = [],
        sendData = config.data;
    if ( typeof sendData === 'string' ){
        var tmpArr = String.prototype.split.call(sendData,'&');
        for (var i = 0, j = tmpArr.length; i < j; i++){
            var datum = tmpArr[i].split('=');
            sendString.push(encodeURIComponent(datum[0]) + '=' + encodeURIComponent(datum[1]));
        }
    } else if ( typeof sendData === 'object' && !( sendData instanceof String || (FormData && sendData instanceof FormData) ) ){
        for (var k in sendData) {
            var datum = sendData[k];
            if ( Object.prototype.toString.call(datum) === '[object Array]' ){
                for (var i = 0, j = datum.length; i < j; i++) {
                    sendString.push(encodeURIComponent(k) + '[]=' + encodeURIComponent(datum[i]));
                }
            } else {
                sendString.push(encodeURIComponent(k) + '=' + encodeURIComponent(datum));
            }
        }
    }
    sendString = sendString.join('&');

    if (config.type === 'GET') {
        xmlhttp2.open('GET', config.url + '?' + sendString, config.method);
        xmlhttp2.send();

        if (config.debugLog === true)
            console.log('GET fired at:' + config.url + '?' + sendString);
    }
    if (config.type === 'POST') {
        xmlhttp2.open('POST', config.url, config.method);
        // alert(config.method)
        xmlhttp2.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xmlhttp2.send(sendString);

        if (config.debugLog === true)
            console.log('POST fired at:' + config.url + ' || Data:' + sendString);
    }
    // alert(result)
    return result;


}

export {minAjax};