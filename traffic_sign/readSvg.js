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
    let item = matchID(id);
    if (item){
        tem = tem.replace('tagPlace',item.id);
        tem = tem.replace('descriptionPlace',item.parentName);
    } else {
        tem = tem.replace('tagPlace',id);
        tem = tem.replace('descriptionPlace',id);
    }
    fileUtils.writeFile('./out/traffic_sign/'+id+'.json',tem);
}
let map = {'tri.1.1.1.1.1':{'icon':'traffic-sign-crossroad-1','name':'交叉 1.1.1.1.1','i':0,'id':'tri.1.1.1.1.1','parentName':'交通牌类型v2.0-三角黑 1道路 1.1交叉路口 1.1.1左右路口 1.1.1.1交叉 1.1.1.1.1'},'tri.1.1.1.1.2':{'icon':'traffic-sign-crossroad-2','name':'不交叉 1.1.1.1.2','i':1,'id':'tri.1.1.1.1.2','parentName':'交通牌类型v2.0-三角黑 1道路 1.1交叉路口 1.1.1左右路口 1.1.1.1不交叉 1.1.1.1.2'},'tri.1.1.1.2.2':{'icon':'traffic-sign-crossroad-3','name':'下 1.1.1.2.2','i':2,'id':'tri.1.1.1.2.2','parentName':'交通牌类型v2.0-三角黑 1道路 1.1交叉路口 1.1.1左边交叉 1.1.1.2下 1.1.1.2.2'},'tri.1.1.1.3.2':{'icon':'traffic-sign-crossroad-4','name':'下 1.1.1.3.2','i':3,'id':'tri.1.1.1.3.2','parentName':'交通牌类型v2.0-三角黑 1道路 1.1交叉路口 1.1.1右边交叉 1.1.1.3下 1.1.1.3.2'},'tri.1.1.1.2.1':{'icon':'traffic-sign-crossroad-5','name':'上 1.1.1.2.1','i':4,'id':'tri.1.1.1.2.1','parentName':'交通牌类型v2.0-三角黑 1道路 1.1交叉路口 1.1.1左边交叉 1.1.1.2上 1.1.1.2.1'},'tri.1.1.1.3.1':{'icon':'traffic-sign-crossroad-6','name':'上 1.1.1.3.1','i':5,'id':'tri.1.1.1.3.1','parentName':'交通牌类型v2.0-三角黑 1道路 1.1交叉路口 1.1.1右边交叉 1.1.1.3上 1.1.1.3.1'},'tri.1.1.1.4.1':{'icon':'traffic-sign-crossroad-7','name':'上 1.1.1.4.1','i':6,'id':'tri.1.1.1.4.1','parentName':'交通牌类型v2.0-三角黑 1道路 1.1交叉路口 1.1.1T型交叉 1.1.1.4上 1.1.1.4.1'},'tri.1.1.1.4.3':{'icon':'traffic-sign-crossroad-8','name':'右 1.1.1.4.3','i':7,'id':'tri.1.1.1.4.3','parentName':'交通牌类型v2.0-三角黑 1道路 1.1交叉路口 1.1.1T型交叉 1.1.1.4右 1.1.1.4.3'},'tri.1.1.1.4.2':{'icon':'traffic-sign-crossroad-9','name':'左 1.1.1.4.2','i':8,'id':'tri.1.1.1.4.2','parentName':'交通牌类型v2.0-三角黑 1道路 1.1交叉路口 1.1.1T型交叉 1.1.1.4左 1.1.1.4.2'},'tri.1.2.8':{'icon':'traffic-sign-crossroad-10','name':'环形 1.2.8','i':9,'id':'tri.1.2.8','parentName':'交通牌类型v2.0-三角黑 1箭头 1.2环形 1.2.8'},'tri.1.2.3.1':{'icon':'traffic-sign-sharp-turn-left','name':'左 1.2.3.1','i':10,'id':'tri.1.2.3.1','parentName':'交通牌类型v2.0-三角黑 1箭头 1.2急转路 1.2.3左 1.2.3.1'},'tri.1.2.3.2':{'icon':'traffic-sign-sharp-turn-right','name':'右 1.2.3.2','i':11,'id':'tri.1.2.3.2','parentName':'交通牌类型v2.0-三角黑 1箭头 1.2急转路 1.2.3右 1.2.3.2'},'tri.1.1.2.1':{'icon':'traffic-sign-reverse-turn-1','name':'正Z 1.1.2.1','i':12,'id':'tri.1.1.2.1','parentName':'交通牌类型v2.0-三角黑 1道路 1.1反向弯路-单Z字型 1.1.2正Z 1.1.2.1'},'tri.1.1.2.2':{'icon':'traffic-sign-reverse-turn-2','name':'镜像Z 1.1.2.2','i':13,'id':'tri.1.1.2.2','parentName':'交通牌类型v2.0-三角黑 1道路 1.1反向弯路-单Z字型 1.1.2镜像Z 1.1.2.2'}};
function matchID(icon) {
    for (let id in map){
        if (map[id].icon===icon){
            return map[id];
        }
    }
}

parse();