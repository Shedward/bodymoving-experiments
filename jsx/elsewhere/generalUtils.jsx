/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*exported ew_utils */
/*global bm_eventDispatcher */

var ew_utils = (function () {
    'use strict';

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
    
    function filterArray(arr, test) {
        var result = [];
        for (var indx = 0; indx < arr.length; indx++) {
            if (test(arr[indx])) {
                result.push(arr[indx]);
            }
        }
        return result;
    }
    
    function mapArray(arr, transform) {
        var result = [];
        
        for (var indx = 0; indx < arr.length; indx++) {
            result.push(transform(arr[indx]));
        }
        return result;
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
    
    function shortestZipArrays(arrs) {
        return zipArrays(arrs, true);
    }

    function longestZipArrays(arrs) {
        return zipArrays(arrs, false);
    }

    function forEachIfArray(arrayOrValue, action) {
        if (isArray(arrayOrValue)) {
            forEachInArray(arrayOrValue, action);
        } else {
            action(arrayOrValue);
        }
    }

    function zipArrays(arrs, minLength) {
        var comparator;
        if (minLength) {
            comparator = function (lhs, rhs) { return lhs < rhs; }
        } else {
            comparator = function (lhs, rhs) { return lhs > rhs; }
        }

        var minSize = arrs[0].length || 0;
        forEachInArray(arrs, function(arr) {
            if (comparator(arr.length, minSize)) {
                minSize = arr.length;   
            }
        });
        
        var zipped = [];
        for (var indx = 0; indx < minSize; indx++) {
            var zippedElem = mapArray(arrs, function (e) { return e[indx]; });
            zipped.push(zippedElem);
        }
        
        return zipped;
    }
    
    function stringStartsWith(string, search, rawPos) {
        var pos = rawPos > 0 ? rawPos|0 : 0;
        return string.substring(pos, pos + search.length) === search;
    }
    
    function isArray(array) {
        return Object.prototype.toString.call(array) === '[object Array]';
    }

    var obj = {
        showError: showError,
        shortestZipArrays: shortestZipArrays,
        longestZipArrays: longestZipArrays,
        forEachInArray: forEachInArray,
        filterArray: filterArray,
        mapArray: mapArray,
        findInArray: findInArray,
        stringStartsWith: stringStartsWith,
        log: log,
        isArray: isArray,
        forEachIfArray: forEachIfArray
    };
    
    return obj;
}());
