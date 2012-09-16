ZoomMapTile
===========

Zooming map tiles bigger than maxZoom setting, in Google Maps API, Leaflet and OpenLayers.

Latest version 0.0.3 is for GMaps API and Leaflet(Test version). OpenLayers will be supported in future.

This library is suit for:
If there is a TMS service which supports zoom 17 as maxZoom, but if you want to overlay it as zoom 20.

Google Maps API version, ZoomTMSLayer.js

	// Create instance
	// tileMaxZoom is maxZoom provided by service.
	// maxZoom is you need.
	var map = new google.maps.Map(
		document.getElementById("map"), {
			zoom: 16,
			center: new google.maps.LatLng(35.68721, 139.7704),
			mapTypeId: google.maps.MapTypeId.ROADMAP
		}
	);
	
	var tms = new ZoomTMSLayer(map, {
		url:         'http://www.example.com/tms/',
		layername :  'Some_Layer',
		tileMaxZoom: 17,
		maxZoom:     20,
	});
	
	map.overlayMapTypes.insertAt(0, tms);

Leaflet version: L.ZoomTMSLayer.js (somewhat dirty and heavy, so just a test version)

	// Create instance
	var map = L.map('map').setView([35.68721, 139.7704], 16);
	
	var tms = L.zoomTMSLayer({
		url:         'http://www.example.com/tms/',
		layername :  'Some_Layer',
		tileMaxZoom: 17,
		maxZoom:     20,
	});
	
	tms.addTo(map);

From version 0.0.2, library is based on Gavin Harriss's CustomTileOverlay.js

http://www.gavinharriss.com/code/opacity-control
