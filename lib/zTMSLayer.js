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

/* This library is based on CustomTileOverlay.js */

/*******************************************************************************
Copyright (c) 2010-2012. Gavin Harriss
Site: http://www.gavinharriss.com/
Originally developed for: http://www.topomap.co.nz/

Licences: Creative Commons Attribution 3.0 New Zealand License
http://creativecommons.org/licenses/by/3.0/nz/
******************************************************************************/

ZoomingTMSLayer = function (map, options) {
	if ((typeof map) === 'undefined' || (typeof options) === 'undefined') throw new Error('Both map object & options are required.');    
	if ((typeof options.url) === 'undefined')         throw new Error('Url property is required.');
	if ((typeof options.layername) === 'undefined')   throw new Error('Layername property is required.');
	if ((typeof options.tileMaxZoom) === 'undefined') throw new Error('TileMaxZoom property is required.');
	
    this.tileSize = new google.maps.Size(256, 256); // Change to tile size being used
	this.map      = map;
    this.tiles    = [];
	this.visible  = true;

	for (var property in options) {
		this[property] = options[property];
	}
};

ZoomingTMSLayer.prototype                = new google.maps.OverlayView();
ZoomingTMSLayer.prototype.maxZoom        = null;
ZoomingTMSLayer.prototype.minZoom        = 0;
ZoomingTMSLayer.prototype.tileMaxZoom    = null;
ZoomingTMSLayer.prototype.name           = '';
ZoomingTMSLayer.prototype.alt            = '';
ZoomingTMSLayer.prototype.serviceVersion = '1.0.0';
ZoomingTMSLayer.prototype.layername      = null;
ZoomingTMSLayer.prototype.type           = 'png';
ZoomingTMSLayer.prototype.tms            = true;
ZoomingTMSLayer.prototype.opacity        = 100;

ZoomingTMSLayer.prototype.getTile        = function(tile, zoom, ownerDocument) {

	if ((this.maxZoom !== null && zoom > this.maxZoom) || zoom < this.minZoom) {
		return null;
	}

	// If tile already exists then use it
    var t_key = 't_' + tile.x + '_' + tile.y + '_' + zoom;
	for (var n = 0; n < this.tiles.length; n++) {
		if (this.tiles[n].id == t_key) {
            this.setObjectOpacity(this.tiles[n]);
			return this.tiles[n];
		}
	}

	// If tile doesn't exist then create it
	var div = ownerDocument.createElement('div');
	div.id = t_key;
	div.style.width = this.tileSize.width + 'px';
	div.style.height = this.tileSize.height + 'px';

	var zoomDiff = zoom - this.tileMaxZoom;
	if (zoomDiff < 0) zoomDiff = 0;
	var y    = this.tms ? (1<<zoom) - tile.y - 1 : tile.y ;
	var normTile = {x:tile.x,y:y};

	var img = ownerDocument.createElement("img");
	img.style.width  = this.tileSize.width  + "px";
	img.style.height = this.tileSize.height + "px";
    img.galleryimg = 'no';

	var imgBase;

	if (zoomDiff > 0) {
		var dScale = Math.pow(2,zoomDiff);
		var dTranslate = 256 * (dScale -1) / (dScale * 2);
		var dSize  = 256 / dScale;
		var aX     = normTile.x % dScale;
		var dX     = dTranslate - aX * dSize;
		var aY     = this.tms ? (dScale - (normTile.y % dScale) - 1) : (normTile.y % dScale);
		var dY     = - aY * dSize;
		normTile.x = Math.floor(normTile.x / dScale);
		normTile.y = Math.floor(normTile.y / dScale);
		var transStr = "scale(" + dScale + "," + dScale + ") translate(" + dX + "px," + dY + "px)";

		imgBase = ownerDocument.createElement('div');
		if (typeof (imgBase.style.transform)       == 'string') { imgBase.style.transform       = transStr; }
		if (typeof (imgBase.style.msTransform)     == 'string') { imgBase.style.msTransform     = transStr; }
		if (typeof (imgBase.style.webkitTransform) == 'string') { imgBase.style.webkitTransform = transStr; }
		if (typeof (imgBase.style.MozTransform)    == 'string') { imgBase.style.MozTransform    = transStr; }
		if (typeof (imgBase.style.OTransform)      == 'string') { imgBase.style.OTransform      = transStr; }
		imgBase.style.border = '0px';

        img.style.position = 'absolute';
		img.style.clip = "rect(" + (aY * dSize) + "px," + ((aX + 1) * dSize) + "px," + ((aY + 1) * dSize) + "px," + (aX * dSize) + "px)";
        console.log(img.style.clip);
		
		div.appendChild(imgBase);
	} else {
		imgBase = div;
	}

	img.onload  = function() { 
		imgBase.appendChild(img); 
		img     = null;
		div     = null;
		imgBase = null;
	};
	img.onerror = function() {
		img     = null;
		div     = null;
		imgBase = null;
	};
	img.src = this.getTileUrl(normTile, zoom - zoomDiff);

	if (!this.visible) {
		div.style.display = 'none';
	}

	this.tiles.push(div)
	this.setObjectOpacity(div);

	return div;
};

// Save memory / speed up the display by deleting tiles out of view
// Essential for use on iOS devices such as iPhone and iPod!
ZoomingTMSLayer.prototype.deleteHiddenTiles = function (zoom) {
	var bounds = this.map.getBounds();
	var tileNE = this.getTileUrlCoordFromLatLng(bounds.getNorthEast(), zoom);
	var tileSW = this.getTileUrlCoordFromLatLng(bounds.getSouthWest(), zoom);

	var minX = tileSW.x - 1;
	var maxX = tileNE.x + 1;
	var minY = tileSW.y - 1;
	var maxY = tileNE.y + 1;

	var tilesToKeep = [];
	var tilesLength = this.tiles.length;
	for (var i = 0; i < tilesLength; i++) {
		var idParts = this.tiles[i].id.split("_");
		var tileX = Number(idParts[1]);
		var tileY = Number(idParts[2]);
		var tileZ = Number(idParts[3]);
		if ((
				(minX < maxX && (tileX >= minX && tileX <= maxX))
				|| (minX > maxX && ((tileX >= minX && tileX <= (Math.pow(2, zoom) - 1)) || (tileX >= 0 && tileX <= maxX))) // Lapped the earth!
			)
			&& (tileY >= minY && tileY <= maxY)
			&& tileZ == zoom) {
			tilesToKeep.push(this.tiles[i]);
		}
		else {
			delete this.tiles[i];
		}
	}
	
	this.tiles = tilesToKeep;
};

ZoomingTMSLayer.prototype.pointToTile = function (point, z) {
	var projection = this.map.getProjection();
	var worldCoordinate = projection.fromLatLngToPoint(point);
	var pixelCoordinate = new google.maps.Point(worldCoordinate.x * Math.pow(2, z), worldCoordinate.y * Math.pow(2, z));
	var tileCoordinate = new google.maps.Point(Math.floor(pixelCoordinate.x / this.tileSize.width), Math.floor(pixelCoordinate.y / this.tileSize.height));
	return tileCoordinate;
}

ZoomingTMSLayer.prototype.getTileUrlCoordFromLatLng = function (latlng, zoom) {
	return this.getTileUrlCoord(this.pointToTile(latlng, zoom), zoom)
}

ZoomingTMSLayer.prototype.getTileUrlCoord = function (coord, zoom) {
	var tileRange = 1 << zoom;
	var y = tileRange - coord.y - 1;
	var x = coord.x;
	if (x < 0 || x >= tileRange) {
		x = (x % tileRange + tileRange) % tileRange;
	}
	return new google.maps.Point(x, y);
}

ZoomingTMSLayer.prototype.getTileUrl     = function(tile, zoom) {
	var path = zoom + '/' + tile.x + '/' + tile.y + '.' + this.type;
	if (this.layername != '') {
		path = this.layername + '/' + path;
	}
    if (this.serviceVersion != '') {
		path = this.serviceVersion + '/' + path;
	}
    return this.url + path;
};

ZoomingTMSLayer.prototype.hide = function () {
	this.visible = false;

	var tileCount = this.tiles.length;
	for (var n = 0; n < tileCount; n++) {
		this.tiles[n].style.display = 'none';
	}
}

ZoomingTMSLayer.prototype.show = function () {
	this.visible = true;
    
	var tileCount = this.tiles.length;
	for (var n = 0; n < tileCount; n++) {
		this.tiles[n].style.display = '';
	}
}

ZoomingTMSLayer.prototype.releaseTile = function (tile) {
	tile = null;
}

ZoomingTMSLayer.prototype.setOpacity = function (op) {
	this.opacity = op;

	var tileCount = this.tiles.length;
	for (var n = 0; n < tileCount; n++) {
		this.setObjectOpacity(this.tiles[n]);
	}
}

ZoomingTMSLayer.prototype.setObjectOpacity = function (obj) {
	if (typeof (obj.style.filter)       == 'string') { obj.style.filter       = 'alpha(opacity:' + this.opacity + ')'; }
	if (typeof (obj.style.KHTMLOpacity) == 'string') { obj.style.KHTMLOpacity = this.opacity / 100; }
	if (typeof (obj.style.MozOpacity)   == 'string') { obj.style.MozOpacity   = this.opacity / 100; }
	if (typeof (obj.style.opacity)      == 'string') { obj.style.opacity      = this.opacity / 100; }
}

