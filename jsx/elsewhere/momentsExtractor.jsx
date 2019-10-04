/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global bm_layerElement */
/*exported ew_momentsExtractor */
/*global ew_metadataManager, ew_utils, ew_contentExtractor */

var ew_momentsExtractor = (function () {
    'use strict';

    var contentType = {
        unknown: "UNKNOWN",
        shape: "SHAPE",
        text: "TEXT"
    };
    
    var contentTypeNamePrefixRules = [
        { prefix: "shape", contentType: contentType.shape },
        { prefix: "text", contentType: contentType.text }
    ];
    
    function contentTypeForImageLayer(layer) {
        var originalType = ew_metadataManager.read(layer, ew_metadataManager.key.originalType);
        if (originalType) {
            switch (originalType) {
                case bm_layerElement.layerTypes.text:
                    return contentType.text;
                case bm_layerElement.layerTypes.shape:
                    return contentType.shape;
                default:
                    break;
            }
        }
        var appliciblePrefixRule = ew_utils.findInArray(contentTypeNamePrefixRules, function (rule) {
            return ew_utils.stringStartsWith(layer.nm, rule.prefix)
        });
        if (appliciblePrefixRule) {
            return appliciblePrefixRule.contentType;
        }
        
        return contentType.unknown;
    }

    function momentFromLayer(layer, framerate, assets) {
        ew_utils.log("Started extracting moment from layer " + layer.nm);
        var asset = ew_utils.findInArray(assets, function(asset) { 
            return asset.id == layer.refId 
        });
        if (!asset) {
            return undefined;
        }
        
        var startTime = layer.ip / framerate;
        var contentType = contentTypeForImageLayer(layer);

        return {
            layerName: layer.nm,
            position: startTime,
            assetName: asset.p,
            assetSize: {
                width: asset.w,
                height: asset.h
            },
            contentType: contentType,
            contentValue: ew_contentExtractor.extractContentFromLayer(layer, contentType)
        };
    }

    function extractMoments(animation) {
        ew_utils.log(animation);
        ew_utils.log(animation.layers.filter);
        ew_utils.log(animation.layers);
        ew_utils.log("Test");
        var imageLayers = ew_utils.filterArray(animation.layers, function (layer) {
            return layer.ty == bm_layerElement.layerTypes.still;
        });
        var moments = ew_utils.filterArray(ew_utils.mapArray(imageLayers, function (layer) {
                return momentFromLayer(layer, animation.fr, animation.assets);
            }), function (moment) {
                return moment != undefined;
            });
        return moments;
    }
    
    var obj = {
        contentType: contentType,
        extractMoments: extractMoments
    };
    return obj;
}());
