
// http://2ality.com/2015/01/es6-set-operations.html

// Difference (a \ b): create a set that contains those elements of set a that are not in set b.
// This operation is also sometimes called minus (-).
// var a = [1,2,3];
// var b = [4,3,2];
// utilArrayDifference(a, b)
//   [1]
// utilArrayDifference(b, a)
//   [4]
export function utilArrayDifference(a, b) {
    var other = new Set(b);
    return Array.from(new Set(a))
        .filter(function(v) { return !other.has(v); });
}

// Intersection (a ∩ b): create a set that contains those elements of set a that are also in set b.
// var a = [1,2,3];
// var b = [4,3,2];
// utilArrayIntersection(a, b)
//   [2,3]
export function utilArrayIntersection(a, b) {
    var other = new Set(b);
    return Array.from(new Set(a))
        .filter(function(v) { return other.has(v); });
}

// Union (a ∪ b): create a set that contains the elements of both set a and set b.
// var a = [1,2,3];
// var b = [4,3,2];
// utilArrayUnion(a, b)
//   [1,2,3,4]
export function utilArrayUnion(a, b) {
    var result = new Set(a);
    b.forEach(function(v) { result.add(v); });
    return Array.from(result);
}

// Returns an Array with all the duplicates removed
// var a = [1,1,2,3,3];
// utilArrayUniq(a)
//   [1,2,3]
export function utilArrayUniq(a) {
    return Array.from(new Set(a));
}
