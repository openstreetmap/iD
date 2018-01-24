let fs = require('fs');

module.exports.writeFile = function (filePath,file) {
    fs.writeFile(filePath,file,function(err){
        if (err){
            console.log(err);
        } else {
            console.log('file writes sucess!!');
        }
    });
};

module.exports.readFile = function (filePath) {
    return fs.readFileSync(filePath,'utf-8');
};