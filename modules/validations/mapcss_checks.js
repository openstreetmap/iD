export function validationMapCSSChecks() {
    var validation = function(changes, graph, rules, areaKeys) {
        var warnings = [];
        var createdModified = ['created', 'modified'];
        for (var i = 0; i < createdModified.length; i++) {
            var entities = changes[createdModified[i]];
            for (var j = 0; j < entities.length; j++) {
                var entity = entities[j];
                for (var k = 0; k < rules.length; k++) {
                    var rule = rules[k];
                    rule.findWarnings(entity, graph, warnings);
                }
            }
        }
        return warnings;
    };
    return validation;
}
