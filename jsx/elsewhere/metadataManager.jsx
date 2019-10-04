/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*exported ew_metadataManager */

var ew_metadataManager = (function() {
    'use strict';
    
    var prefix = "ew_";
    var key = {
        text: "text",
        originalType: "originalType"
    }

    function ew_key(name) {
        return prefix + name;
    }
    
    function write(obj, key, value) {
        obj[ew_key(key)] = value;
    }
    
    function read(obj, key) {
        return obj[ew_key(key)];
    }
    
    function remove(obj, key) {
        delete obj[ew_key(key)];
    }
    
    function removeAll(obj) {
        for (var key in obj) {
            if (key.startsWith(prefix) && obj.hasOwnProperty(key)) {
                delete obj[key];
            }
        }
    }
    
    var obj = {
        key: key,
        write: write,
        read: read,
        remove: remove,
        removeAll: removeAll
    };
    return obj;
}());
