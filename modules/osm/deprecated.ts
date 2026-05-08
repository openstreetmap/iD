export type DataDeprecated = { old: Tags; replace?: Tags }[];

/** @param {Tags} tags @param {DataDeprecated} dataDeprecated */
export function getDeprecatedTags(tags: Tags, dataDeprecated: DataDeprecated) {
  // if there are no tags, none can be deprecated
  if (Object.keys(tags).length === 0) return [];

  var deprecated: DataDeprecated = [];
  dataDeprecated.forEach((d) => {
    const oldKeys = Object.keys(d.old);
    const transferKeys = oldKeys.filter(key => d.old[key] === '*');
    if (d.replace) {
      var hasExistingValues = Object.keys(d.replace).some((replaceKey) => {
        if (!tags[replaceKey] || d.old[replaceKey]) return false;
        var replaceValue = d.replace![replaceKey];
        if (replaceValue === '*') return false;
        if (replaceValue.startsWith('$1') && tags[replaceKey] === tags[transferKeys[+replaceValue.substring(1) - 1]]) return false;
        if (replaceValue === tags[replaceKey]) return false;
        return true;
      });
      // don't flag deprecated tags if the upgrade path would overwrite existing data - #7843
      if (hasExistingValues) return;
    }

    var matchesDeprecatedTags = oldKeys.every((oldKey) => {
      if (!tags[oldKey]) return false;
      if (d.old[oldKey] === '*') return true;
      if (d.old[oldKey] === tags[oldKey]) return true;

      var vals = tags[oldKey].split(';').filter(Boolean);
      if (vals.length === 0) {
        return false;
      } else if (vals.length > 1) {
        return vals.indexOf(d.old[oldKey]) !== -1;
      } else {
        if (tags[oldKey] === d.old[oldKey]) {
          if (d.replace && d.old[oldKey] === d.replace[oldKey]) {
            var replaceKeys = Object.keys(d.replace);
            return !replaceKeys.every((replaceKey) => {
              return tags[replaceKey] === d.replace![replaceKey];
            });
          } else {
            return true;
          }
        }
      }

      return false;
    });

    if (matchesDeprecatedTags) {
      deprecated.push(d);
    }
  });

  return deprecated;
}

var _deprecatedTagValuesByKey: { [key: string]: string[] };

export function deprecatedTagValuesByKey(dataDeprecated: DataDeprecated) {
    if (!_deprecatedTagValuesByKey) {
        _deprecatedTagValuesByKey = {};
        dataDeprecated.forEach((d) => {
            var oldKeys = Object.keys(d.old);
            if (oldKeys.length === 1) {
                var oldKey = oldKeys[0];
                var oldValue = d.old[oldKey];
                if (oldValue !== '*') {
                    if (!_deprecatedTagValuesByKey[oldKey]) {
                        _deprecatedTagValuesByKey[oldKey] = [oldValue];
                    } else {
                        _deprecatedTagValuesByKey[oldKey].push(oldValue);
                    }
                }
            }
        });
    }
    return _deprecatedTagValuesByKey;
};
