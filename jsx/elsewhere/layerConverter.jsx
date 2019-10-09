/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*exported ew_layerConverter */
/*global bm_layerElement, ew_metadataManager, ew_utils, bm_shapeHelper */

var ew_layerConverter = (function (){
    'use strict';
    
    var config = {
        convertLayersToImage: true,
        removeUnsupportedLayers: true
    };
    
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
    
    function sizeOfShape(shapes) {
        var size;
        ew_utils.forEachIfArray(shapes, function (shape) {
            var currentSize;
            switch (shape.ty) {
                case bm_shapeHelper.shapeItemTypes.rect:
                    currentSize = shape.s.k;
                    break;
                case bm_shapeHelper.shapeItemTypes.ellipse:
                    currentSize = shape.s.k;
                    break;
                case bm_shapeHelper.shapeItemTypes.shape:
                    currentSize = [0, 0];
                    break;
                case bm_shapeHelper.shapeItemTypes.group:
                    currentSize = sizeOfShape(shape.it);
                    break;
            }
            
            if (currentSize[0] > size[0]) {
                size[0] = currentSize[0];
            }
            if (currentSize[1] > size[1]) {
                size[1] = currentSize[1];
            }
        });
        return size || [100, 100];
    }
    
    function convertShapeToImage(layer, assets) {
        var originalType = layer.ty;
        layer.ty = bm_layerElement.layerTypes.still;
        ew_metadataManager.write(layer, ew_metadataManager.key.originalType, originalType);
        
        ew_utils.log(layer);
        var size = [ 
            layer.bounds.r - layer.bounds.l,
            layer.bounds.b - layer.bounds.t
        ];
        ew_utils.log(size);
        var newAssetName = "img_shape_" + layer.nm + ".png"
        layer.refId = newAssetName;
        assets.push(asset(newAssetName, size[0], size[1]));
    }
    
    function removeUnsuportedLayers(animation) {
        animation.layers = ew_utils.filterArray(animation.layers, function (layer) {
            return layer.ty == bm_layerElement.layerTypes.still;
        });
    }
    
    function convertToImage(layer, assets) {
        switch (layer.ty) {
            case bm_layerElement.layerTypes.text:
                convertTextToImage(layer, assets);
                break;
            case bm_layerElement.layerTypes.shape:
                convertShapeToImage(layer, assets);
                break;
            default:
                break;
        }
    }
    
    function convertAnimation(animation) {
        if (config.convertLayersToImage) {
            ew_utils.forEachInArray(animation.layers, function (layer) {
                convertToImage(layer, animation.assets);
            });
        }
        
        if (config.removeUnsupportedLayers) {
            removeUnsuportedLayers(animation);   
        }
    }
    
    var obj = {
        convertAnimation: convertAnimation
    };
    return obj;
}());
