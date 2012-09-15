/* Copyright (c) 2012 OHTSUKA Ko-hei
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var ZoomingTMS = function (options) {
    if ((typeof options) === 'undefined')             throw new Error('Options are required.');
    if ((typeof options.url) === 'undefined')         throw new Error('Url property is required.');
    if ((typeof options.layername) === 'undefined')   throw new Error('Layername property is required.');
    if ((typeof options.tileMaxZoom) === 'undefined') throw new Error('TileMaxZoom property is required.');

    for (var property in options) {
        this[property] = options[property];
    }
};

ZoomingTMS.prototype = {
    maxZoom:        null,    
    minZoom:        0,
    tileMaxZoom:    null,
    tileSize:       (((typeof google) !== 'undefined') && ((typeof google.maps) !== 'undefined')) ? new google.maps.Size(256,256) : {width:256,height:256},
    name:           '',
    alt:            '',
    url:            null,
    serviceVersion: '1.0.0',
    layername:      null,
    type:           'png',
    isTMSYAxis:     false,
    
    getTile: function(tile, zoom, ownerDocument) {
        var div = ownerDocument.createElement('div');
        div.style.width  = this.tileSize.width + 'px';
        div.style.height = this.tileSize.height + 'px';
        div.style.border = '0px';

        if ((this.maxZoom !== null && zoom > this.maxZoom) || zoom < this.minZoom) {
            div = null;
            return null;
        }

        var zoomDiff = zoom - this.tileMaxZoom;
        if (zoomDiff < 0) zoomDiff = 0;
        var y    = this.isTMSYAxis ? tile.y : (1<<zoom) - tile.y - 1;
        var normTile = {x:tile.x,y:y};

        var img = ownerDocument.createElement("img");
        img.style.width  = this.tileSize.width  + "px";
        img.style.height = this.tileSize.height + "px";
        //img.onerror = function (e) {
        //    img.src = 'data:image/png;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
        //};
        var imgBase;

        if (zoomDiff > 0) {
            var dScale = Math.pow(2,zoomDiff);
            var dTranslate = 256 * (dScale -1) / (dScale * 2);
            var dSize  = 256 / dScale;
            var aX     = normTile.x % dScale;
            var dX     = dTranslate - aX * dSize;
            var aY     = dScale - (normTile.y % dScale) - 1;
            var dY     = dTranslate - aY * dSize;
            normTile.x = Math.floor(normTile.x / dScale);
            normTile.y = Math.floor(normTile.y / dScale);
            var transStr = "scale(" + dScale + "," + dScale + ") translate(" + dX + "px," + dY + "px)";

            imgBase = ownerDocument.createElement('div');
            imgBase.style.transform = transStr;
            imgBase.style.msTransform = transStr;
            imgBase.style.webkitTransform = transStr;
            imgBase.style.MozTransform = transStr;
            imgBase.style.OTransform = transStr;
            imgBase.style.border = '0px';

            img.style.clip = "rect(" + (aY * dSize) + "px," + ((aX + 1) * dSize) + "px," + ((aY + 1) * dSize) + "px," + (aX * dSize) + "px)";
            
            div.appendChild(imgBase);
        } else {
            imgBase = div;
        }

        img.onload  = function() { imgBase.appendChild(img); };
        img.onerror = function() {
            if (div.parentNode) {
                div.parentNode.removeChild(div);
            }
            img     = null;
            div     = null;
            imgBase = null;
        };
        img.src = this.getTileUrl(normTile, zoom - zoomDiff);
        
        return div;
    },

    getTileUrl: function(tile, zoom) {
        var path = this.layername + '/' + zoom + '/' + tile.x + '/' + tile.y + '.' + this.type;
        if (this.serviceVersion != '') {
            path = this.serviceVersion + '/' + path;
        }
        return this.url + path;
    },
};
