/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*exported ew_contentExtractor */
/*global ew_momentsExtractor, ew_utils, ew_metadataManager */

var ew_contentExtractor = (function() {
    'use strict';

    function isZeroPoint(point) {
        return point[0] == 0 && point[1] == 0;
    }

    function pointFromArray(point) {
        if (isZeroPoint(point)) {
            return undefined;
        }
        
        return {
            x: point[0],
            y: point[1]
        }
    }
    
    function convertBMPathToEWPath(bmPath) {
        if (!bmPath) {
            return undefined;
        }
        
        var groupedPoints  = ew_utils.shortestZipArrays([ bmPath.v, bmPath.i, bmPath.o ]);
        var points = ew_utils.mapArray(groupedPoints, function (pointData) {
            return {
                p: pointFromArray(pointData[0]),
                'in': pointFromArray(pointData[1]),
                out: pointFromArray(pointData[2])
            };
        });
        
        return points;
    }
    
    function extractMask(layer) {
        if (!layer.hasMask) {
            return undefined;
        }
        
        var mask = ew_utils.findInArray(layer.masksProperties, function(mask) {
            return ew_utils.stringStartsWith(mask.nm, "export");
        });
        
        if (!mask) {
            return undefined;
        }
        
        var path;
        var maskValue = mask.pt.k;
        if (ew_utils.isArray(maskValue.isArray)) {
            path = maskValue[0].s[0];
        } else {
            path = maskValue;
        }
        
        return {
            inverted: mask.inverted || false,
            path: convertBMPathToEWPath(path)
        }
    }
    
    function extractText(layer) {
        var textDocument = ew_metadataManager.read(layer, ew_metadataManager.key.text);
        return textDocument.t;
    }
    
    function extractContentFromLayer(layer, contentType) {
        switch (contentType) {
            case ew_momentsExtractor.contentType.shape:
                return {
                    mask: extractMask(layer)
                }
            case ew_momentsExtractor.contentType.text:
                return {
                    text: extractText(layer)
                };
            case ew_momentsExtractor.contentType.unknown:
                return undefined;
        }
    }
    
    var obj = {
        extractContentFromLayer: extractContentFromLayer
    };
    return obj;
}());
