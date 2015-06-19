iD.validations.ManyDeletions = function() {
    var threshold = 100;

    var validation = function(changes) {
        var warnings = [];
        if (changes.deleted.length > threshold) {
            warnings.push({
                id: 'many_deletions',
                message: t('validations.many_deletions', { n: changes.deleted.length })
            });
        }
        return warnings;
    };

    return validation;
};
