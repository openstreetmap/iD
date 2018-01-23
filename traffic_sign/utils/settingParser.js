let index=0;
function createParser() {
    var properties = {'tasktype': 'title', 'save_name': 'display_name'};
    // var subs = [];
    var results = [];
    return function parseSetting(settings,parentName) {
        if (!parentName){
            parentName='';
        }
        let noChild = true;
        for (let pro in settings) {
            // let value = settings[pro];
            // if (typeof value == 'object') {
            //     parseSetting(value,parentName);
            //     noChild=false;
            // } else if (typeof value == 'array') {
            //     for (let i = 0; i < value.length; i++) {
            //         parseSetting(value[i],parentName);
            //     }
            //     noChild=false;
            // }
            if (properties[pro]) {
                parentName+=settings[properties[pro]];
            }
        }
        for (let pro in settings) {
            let value = settings[pro];
            if (typeof value == 'object') {
                parseSetting(value,parentName);
                noChild=false;
            } else if (typeof value == 'array') {
                for (let i = 0; i < value.length; i++) {
                    parseSetting(value[i],parentName);
                }
                noChild=false;
            }
            // if (properties[pro]) {
            //     parentName+=settings[properties[pro]];
            // }
        }
         if (noChild){
            for (let pro in  properties){
                if (settings[pro]) {
                    results.push({'key': settings[pro], 'value': settings[properties[pro]],'i':index,'fullName':parentName});
                    index++;
                }
            }

        }
        return results;
    };
}
module.exports = createParser;