let loadXml = require( './utils/xmlutils.js');
let fileUtils = require('./utils/fileutils');
let xml = loadXml('./in/traffic_sign.svg');
let nodes = xml('/svg/g');

let file='';
let onefile = '';
let svgIDs = [];
let cateStr = '';
function parse() {
    for (let node in nodes){
        let attrID = xml.getAttrID(nodes[node]);
        svgIDs.push(attrID);
        writeItem(attrID);
        cateStr+=',"traffic_sign/category"\n'.replace('category',attrID);
        console.log(attrID);
    }
    fileUtils.writeFile('./out/svgIds.json',JSON.stringify(svgIDs));
    fileUtils.writeFile('./out/cateStr.json',cateStr);

}

let tample = '{\n' +
    '  "icon": "iconPlace",\n' +
    '  "fields": [\n' +
    '    "name"\n' +
    '  ],\n' +
    '  "geometry": [\n' +
    '    "point"\n' +
    '  ],\n' +
    '  "tags": {\n' +
    '    "traffic_sign": "tagPlace"\n' +
    '  },\n' +
    '  "terms": [],\n' +
    '  "name": "descriptionPlace"\n' +
    '}';
function writeItem(id) {
    let tem = tample;
    tem = tem.replace('iconPlace',id);
    tem = tem.replace('tagPlace',id);
    tem = tem.replace('descriptionPlace',id);
    fileUtils.writeFile('./out/traffic_sign/'+id+'.json',tem);
}

parse();