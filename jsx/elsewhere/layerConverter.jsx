/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*exported ew_layerConverter */
/*global bm_layerElement, ew_metadataManager, ew_utils */

var ew_layerConverter = (function (){
    'use strict';
    
    function asset(name, width, height) {
        return {
            id: name,
            w: width,
            h: height,
            u: "/images",
            p: name,
            e: 0
        }
    }
    
    function movePointsInBezierPath(path, diff) {
        path.v = ew_utils.mapArray(path.v, function (v) {
            return [
                (v[0] || 0) + (diff[0] || 0),
                (v[1] || 0) + (diff[1] || 0)
            ];
        });
    }

    function moveAnchorPointInLayer(layer, newAnchorPoint) {
        layer.ks.a.k = newAnchorPoint;

        if (layer.hasMask) {
            ew_utils.forEachIfArray(layer.masksProperties, function (mask) {
                ew_utils.forEachIfArray(mask.pt.k, function (keyframe) {
                    if (keyframe.s) {
                        ew_utils.forEachIfArray(keyframe.s, function (s) {
                            movePointsInBezierPath(s, newAnchorPoint);
                        });
                    }
                    if (keyframe.e) {
                        ew_utils.forEachIfArray(keyframe.e, function (e) {
                            movePointsInBezierPath(e, newAnchorPoint);
                        });
                    }
                });
            });
        }
    }
    
    function convertTextToImage(layer, assets) {
        var originalType = layer.ty;
        layer.ty = bm_layerElement.layerTypes.still;
        ew_metadataManager.write(layer, ew_metadataManager.key.originalType, originalType)
        
        var textDoc = layer.t.d.k[0].s;
        delete layer.t;
        ew_metadataManager.write(layer, ew_metadataManager.key.text, textDoc);
    
        var textSize = textDoc.sz;
        var newAssetName = "img_text_" + layer.nm + ".png"
        layer.refId = newAssetName;
        assets.push(asset(newAssetName, textSize[0], textSize[1]));
        
        var textPos = textDoc.ps;
        var newAnchorPoint = [
            -textPos[0] || 0,
            -textPos[1] || 0 - (textDoc.lh || 0),
            -textPos[2] || 0
        ];
        moveAnchorPointInLayer(layer, newAnchorPoint);
    }
    
    function removeUnsuportedLayers(animation) {
        animation.layers = ew_utils.filterArray(animation.layers, function (layer) {
            return layer.ty == bm_layerElement.layerTypes.still;
        });
    }
    
    function convertToImage(layer, assets) {
        switch (layer.ty) {
            case bm_layerElement.layerTypes.text:
                convertTextToImage(layer, assets)
                break;
            default:
                break;
        }
    }
    
    function convertAnimation(animation) {
        ew_utils.forEachInArray(animation.layers, function (layer) {
            convertToImage(layer, animation.assets);
        });
        
        removeUnsuportedLayers(animation);
    }
    
    var obj = {
        convertAnimation: convertAnimation
    };
    return obj;
}());
