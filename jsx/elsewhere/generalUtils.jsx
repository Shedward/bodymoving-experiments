/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*exported ew_utils */
/*global bm_eventDispatcher */

var ew_utils = (function () {
    var enable_debug_logging = true;
    
    function log(msg) {
        if (enable_debug_logging) {
            bm_eventDispatcher.log(msg);
        }
    }
    
    function showError(msg) {
        if (enable_debug_logging) {
            throw msg
        }
    }
    
    function forEachInArray(arr, action) {
        for (var indx = 0; indx < arr.length; indx++) {
            action(arr[indx])
        }
    }
    
    function findInArray(arr, test) {
        var foundElement;

        forEachInArray(arr, function(val) {
            if (test(val)) {
                foundElement = val
            }
        });

        return foundElement;
    }
    
    function zipArrays(arrs) {
        var minSize = arrs[0].length || 0;
        forEachInArray(arrs, function(arr) {
            if (arr.length < minSize) {
                minSize = arr.length;   
            }
        });
        
        var zipped = [];
        for (var indx = 0; indx < minSize; indx++) {
            var zippedElem = arrs.map(function (e) { return e[indx]; });
            zipped.push(zippedElem);
        }
        
        return zipped;
    }
    
    function stringStartsWith(string, search, rawPos) {
        var pos = rawPos > 0 ? rawPos|0 : 0;
        return string.substring(pos, pos + search.length) === search;
    }
    
    var obj = {
        showError: showError,
        zipArrays: zipArrays,
        forEachInArray: forEachInArray,
        findInArray: findInArray,
        stringStartsWith: stringStartsWith,
        log: log
    };
    
    return obj;
}());