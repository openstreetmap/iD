var rf = require('fs');
var select = require('xpath.js'),
    dom = require('xmldom').DOMParser;
function loadXMl(filePath) {
    try {
        var data = rf.readFileSync(filePath, 'utf-8');
        var doc = new dom().parseFromString(data);
        // var nodes =
    } catch (e){
        console.log(e);
    }
    function selectElement(xpath) {
        return select(doc, xpath);
    }
    selectElement.getAttrID = function (node) {
        let attributes = node.attributes;
        for (let attrs in attributes) {
            if (attributes[attrs].name === 'id') {
                return attributes[attrs].nodeValue;
            }
        }
    };
    return selectElement;
}

module.exports = loadXMl;