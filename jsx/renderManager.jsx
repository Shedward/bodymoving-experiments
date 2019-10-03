/*jslint vars: true , plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global bm_layerElement,bm_projectManager, bm_eventDispatcher, bm_sourceHelper, bm_generalUtils, bm_compsManager, bm_downloadManager, bm_textShapeHelper, bm_markerHelper, app, File, bm_dataManager*/

var bm_renderManager = (function () {
    'use strict';
    
    var ob = {}, pendingLayers = [], pendingComps = [], destinationPath, fsDestinationPath, currentCompID, totalLayers, currentLayer, currentCompSettings, hasExpressionsFlag;
    var currentExportedComps = [];
    var version_number = '5.1.18';

    function getParentData(layers, id) {
        var i = 0, len = layers.length;
        while(i < len) {
            if(layers[i].ind === id) {
                return layers[i];
            }
            i += 1;
        }
    }
    
    function restoreParents(layers) {
        
        var layerData, parentData, i, len = layers.length, hasChangedState = false;
        for (i = 0; i < len; i += 1) {
            layerData = layers[i];
            if (layerData.parent){
            }
            if (layerData.parent !== undefined && layerData.render !== false) {
                parentData = getParentData(layers, layerData.parent);
                if (parentData.render === false) {
                    parentData.ty = bm_layerElement.layerTypes.nullLayer;
                    hasChangedState = true;
                    parentData.render = true;
                    if (parentData.isValid === false || parentData.isGuide === false) {
                        parentData.isValid = true;
                    }
                    if(parentData.tt){
                        delete parentData.tt;
                    }
                    if(parentData.td){
                        delete parentData.td;
                    }
                }
            }
        }
        if (hasChangedState) {
            restoreParents(layers);
        }
    }

    function removeHiddenContent(shapes) {
        if(shapes) {
            var i = 0, len = shapes.length;
            while(i < len) {
                if(shapes[i].hd) {
                    shapes.splice(i,1);
                    i -= 1;
                    len -= 1;
                } else if(shapes[i].ty === 'gr') {
                    removeHiddenContent(shapes[i].it);
                }
                i += 1;
            }
        }
    }
    
    function createLayers(comp, layers, framerate, deepTraversing) {
        var i, len = comp.layers.length, layerInfo, layerData, prevLayerData;
        for (i = 0; i < len; i += 1) {
            layerInfo = comp.layers[i + 1];
            layerData = bm_layerElement.prepareLayer(layerInfo);
            ob.renderData.exportData.ddd = layerData.ddd === 1 ? 1 : ob.renderData.exportData.ddd;
            if(currentCompSettings.hiddens && layerData.enabled === false){
                layerData.render = true;
                layerData.enabled = true;
                if(!layerData.td){
                    layerData.hd = true;
                }
            }
            if(currentCompSettings.guideds && layerData.isGuide === true){
                layerData.render = true;
                layerData.hd = true;
            }
            if (layerData.td && prevLayerData && prevLayerData.td) {
                prevLayerData.td = false;
                if (prevLayerData.enabled === false && !currentCompSettings.hiddens) {
                    prevLayerData.render = false;
                }
            } else if (layerData.tt) {
                if (layerData.render === false) {
                    if (prevLayerData.enabled === false && !currentCompSettings.hiddens) {
                        prevLayerData.render = false;
                    }
                    delete prevLayerData.td;
                    delete layerData.tt;
                } else if (prevLayerData.render === false) {
                    delete layerData.tt;
                }
            }
            layers.push(layerData);
            pendingLayers.push({data: layerData, layer: layerInfo, framerate: framerate});
            prevLayerData = layerData;
        }
        restoreParents(layers);
        for (i = 0; i < len; i += 1) {
            layerData = layers[i];
            layerInfo = comp.layers[i + 1];
            bm_layerElement.checkLayerSource(layerInfo, layerData);
            if (layerData.ty === bm_layerElement.layerTypes.text) {
                bm_textShapeHelper.addComps();
            }
            if (layerData.ty === bm_layerElement.layerTypes.precomp && layerData.render !== false && layerData.compId) {
                currentExportedComps.push(layerData.compId);
                if(deepTraversing){
                    layerData.layers = [];
                    createLayers(layerInfo.source, layerData.layers, framerate, deepTraversing);
                }
            }
        }
    }
    
    function render(comp, destination, fsDestination, compSettings) {
        app.beginUndoGroup("Render Bodymovin Animation");
        currentExportedComps = [];
        bm_ProjectHelper.init();
        hasExpressionsFlag = false;
        currentCompID = comp.id;
        currentCompSettings = compSettings;
        bm_eventDispatcher.sendEvent('bm:render:update', {type: 'update', message: 'Starting Render', compId: currentCompID, progress: 0});
        destinationPath = destination;
        fsDestinationPath = fsDestination;
        bm_sourceHelper.reset();
        bm_textShapeHelper.reset();
        bm_layerElement.reset();
        pendingLayers.length = 0;
        pendingComps.length = 0;
        var exportData = {
            v : version_number,
            fr : comp.frameRate,
            ip : comp.workAreaStart * comp.frameRate,
            op : (comp.workAreaStart + comp.workAreaDuration) * comp.frameRate,
            w : comp.width,
            h : comp.height,
            nm: comp.name,
            ddd : 0,
            assets : [],
            comps : [],
            fonts : [],
            layers : [],
            markers : []
            
        };
        currentExportedComps.push(currentCompID);
        ob.renderData.exportData = exportData;
        ob.renderData.firstFrame = exportData.ip * comp.frameRate;
        createLayers(comp, exportData.layers, exportData.fr, true);
        exportExtraComps(exportData);
        exportCompMarkers(exportData, comp);
        totalLayers = pendingLayers.length;
        currentLayer = 0;
        app.scheduleTask('bm_renderManager.renderNextLayer();', 20, false);
    }

    function exportCompMarkers(exportData, comp) {
        
        if(comp.markerProperty && comp.markerProperty.numKeys >= 1) {
            var markerProperty = comp.markerProperty;
            var markersList = exportData.markers;
            var len = markerProperty.numKeys, markerElement;
            for (i = 0; i < len; i += 1) {
                markerData = {};
                markerElement = markerProperty.keyValue(i + 1);
                markerData.tm = markerProperty.keyTime(i + 1) * exportData.fr;
                markerData.cm = markerElement.comment;
                markerData.dr = markerElement.duration * exportData.fr;
                markersList.push(markerData);
            }
        }
    }

    function exportExtraComps(exportData){
        if(currentCompSettings.extraComps.active) {
            var list = currentCompSettings.extraComps.list;
            var i, len = list.length, compData;
            var j, jLen = currentExportedComps.length;
            for(i=0;i<len;i+=1){
                j = 0;
                while(j<jLen){
                    if(currentExportedComps[j] === list[i]){
                        break;
                    }
                    j += 1;
                }
                if(j===jLen){
                    var comp = bm_projectManager.getCompositionById(list[i]);
                    compData = {
                        layers: [],
                        id: comp.id,
                        nm: comp.name,
                        xt: 1
                    };
                    createLayers(comp, compData.layers, exportData.fr, false);
                    exportData.comps.push(compData);
                }
            }
        }
    }
    
    function reset() {
        pendingLayers.length = 0;
        pendingComps.length = 0;
        currentCompSettings = null;
        bm_ProjectHelper.end();
    }

    function dataSaved() {
        bm_eventDispatcher.sendEvent('bm:render:update', {type: 'update', message: 'Render finished ', compId: currentCompID, progress: 1, isFinished: true, fsPath: fsDestinationPath});
        reset();
        bm_textShapeHelper.removeComps();
        bm_compsManager.renderComplete();
        app.endUndoGroup();
    }
    
    function saveData() {
        bm_eventDispatcher.sendEvent('bm:render:update', {type: 'update', message: 'Saving data ', compId: currentCompID, progress: 1});
        bm_dataManager.saveData(ob.renderData.exportData, destinationPath, currentCompSettings, dataSaved);
    }
    
    function clearUnrenderedLayers(layers) {
        var i, len = layers.length;
        for (i = 0; i < len; i += 1) {
            if (layers[i].render === false) {
                layers.splice(i, 1);
                i -= 1;
                len -= 1;
            } else if (layers[i].ty === bm_layerElement.layerTypes.precomp && layers[i].layers) {
                clearUnrenderedLayers(layers[i].layers);
            }
        }
    }
    
    function clearNames(layers) {
        if (hasExpressionsFlag) {
            return;
        }
        var i, len = layers.length;
        for (i = 0; i < len; i += 1) {
            layers[i].nm = null;
            delete layers[i].nm;
            if (layers[i].ty === bm_layerElement.layerTypes.precomp && layers[i].layers) {
                clearNames(layers[i].layers);
            }
        }
        
    }
    
    function removeExtraData() {
        clearUnrenderedLayers(ob.renderData.exportData.layers);
        bm_ProjectHelper.end();
        /* Todo check if "clearNames" it changes filesize significantly */
        //clearNames(ob.renderData.exportData.layers);
    }
    
    function renderNextLayer() {
        if (bm_compsManager.cancelled) {
            return;
        }
        if (pendingLayers.length) {
            var nextLayerData = pendingLayers.pop();
            currentLayer += 1;
            bm_eventDispatcher.sendEvent('bm:render:update', {type: 'update', message: 'Rendering layer: ' + nextLayerData.layer.name, compId: currentCompID, progress: currentLayer / totalLayers});
            bm_layerElement.renderLayer(nextLayerData);
            if (nextLayerData.data.ty === 4 && !currentCompSettings.hiddens) {
                removeHiddenContent(nextLayerData.data.shapes);
            }
        } else {
            removeExtraData();
            bm_sourceHelper.exportImages(destinationPath, ob.renderData.exportData.assets, currentCompID, currentCompSettings.original_names);
        }
    }
    
    function checkFonts() {
        var fonts = bm_sourceHelper.getFonts();
        var exportData;
        if (fonts.length === 0) {
            saveData();
        } else {
            if (currentCompSettings.glyphs) {
                var fontsInfo = {
                    list: []
                };
                var list = fontsInfo.list;
                var i, len = fonts.length, fontOb;
                for (i = 0; i < len; i += 1) {
                    fontOb = {};
                    fontOb.fName = fonts[i].name;
                    fontOb.fFamily = fonts[i].family;
                    fontOb.fStyle = fonts[i].style;
                    list.push(fontOb);
                }
                exportData = ob.renderData.exportData;
                exportData.fonts = fontsInfo;
                bm_textShapeHelper.exportFonts(fontsInfo);
                bm_textShapeHelper.exportChars(fontsInfo);
            } else {
                exportData = ob.renderData.exportData;
                bm_eventDispatcher.sendEvent('bm:render:fonts', {type: 'save', compId: currentCompID, fonts: fonts});
            }
        }
    }
    
    function setChars(chars) {
        if (bm_compsManager.cancelled) {
            return;
        }
        //bm_eventDispatcher.sendEvent('bm:render:chars', {type: 'save', compId: currentCompID, chars: chars});
        var i, len = chars.length;
        for (i = 0; i < len; i += 1) {
            delete chars[i].font;
        }
        setCharsData(chars)
    }
    
    function setFontData(fontData) {
        var exportData = ob.renderData.exportData;
        exportData.fonts = fontData;
        bm_textShapeHelper.exportFonts(fontData);
        //bm_textShapeHelper.exportChars(fontData);
        saveData();
    }
    
    function setCharsData(charData) {
        var exportData = ob.renderData.exportData;
        exportData.chars = charData;
        saveData();
    }
    
    function imagesReady() {
        checkFonts();
    }
    
    function renderLayerComplete() {
        app.scheduleTask('bm_renderManager.renderNextLayer();', 20, false);
    }
    
    function hasExpressions() {
        hasExpressionsFlag = true;
    }

    function getVersion() {
        bm_eventDispatcher.sendEvent('bm:version', {value: version_number});
        bm_eventDispatcher.sendEvent('app:version', {value: app.version});
    }

    function shouldCompressImages() {
        return currentCompSettings.should_compress;
    }

    function getCompressionQuality() {
        return currentCompSettings.compression_rate;
    }

    function shouldEncodeImages() {
        return currentCompSettings.should_encode_images;
    }

    function shouldSkipImages() {
        return currentCompSettings.should_skip_images && !currentCompSettings.should_encode_images;
    }
    
    ob.renderData = {
        exportData : {
            assets : []
        }
    };
    ob.render = render;
    ob.renderLayerComplete = renderLayerComplete;
    ob.renderNextLayer = renderNextLayer;
    ob.setChars = setChars;
    ob.imagesReady = imagesReady;
    ob.setFontData = setFontData;
    ob.setCharsData = setCharsData;
    ob.hasExpressions = hasExpressions;
    ob.getVersion = getVersion;
    ob.shouldCompressImages = shouldCompressImages;
    ob.getCompressionQuality = getCompressionQuality;
    ob.shouldEncodeImages = shouldEncodeImages;
    ob.shouldSkipImages = shouldSkipImages;
    
    return ob;
}());