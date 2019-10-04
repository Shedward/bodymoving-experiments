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
    }
    
    var obj = {
        convertAnimation: convertAnimation,
        convertLayerToImage: convertToImage
    };
    return obj;
}());