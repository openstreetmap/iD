
// import {createParser} from './utils/setting.js';
let fileUtils = require('./utils/fileutils');
// let fs = require('fs');
let createParser = require('./utils/settingParser');


let data = fileUtils.readFile('./in/settings.json');

let settings = JSON.parse(data.toString());

let parser = createParser();
let result = parser(settings);

console.log(data);


// 写入文件
fileUtils.writeFile('./out/setting.json', JSON.stringify(result));
