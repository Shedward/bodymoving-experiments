/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global bm_layerElement */
/*exported Elsewhere */

var Elsewhere = (function () {
    function momentFromLayer(layer) {
        return layer
    }

    function extractMoments(animation) {
        var imageLayers = animation.layers.filter(function (layer) {
            return layer.ty == bm_layerElement.layerTypes.still;
        });
        var moments = imageLayers.map(momentFromLayer)
        return { 
            count: moments.length,
            moments: moments
        };
    }
    
    function convertLayersToImages() {
        // not implemented
    }
    
    var obj = {
        extractMoments: extractMoments,
        convertLayersToImages: convertLayersToImages
    };
    return obj;
}());