ZoomMapTile
===========

Zooming map tiles bigger than maxZoom setting, in Google Maps API, Leaflet and OpenLayers
0.0.1 is for GMaps API, Leaflet and OpenLayers will support in future.

This library is suit for:
If there is a TMS service which supports zoom 17 as maxZoom, but if you want to overlay it as zoom 20.

	// Create instance
    // tileMaxZoom is maxZoom provided by service.
    // maxZoom is you need.
	var tmsLayer = new ZoomingTMS({
	    url:         'http://www.example.com/tms/',
	    layername :  'Some_Layer',
	    tileMaxZoom: 17,
	    maxZoom:     20,
	});
	
	var map = new google.maps.Map(
	    document.getElementById("map"), {
	        zoom: 16,
	        center: new google.maps.LatLng(35.68721, 139.7704),
	        mapTypeId: google.maps.MapTypeId.ROADMAP
	    }
	);
	map.overlayMapTypes.insertAt(0, tmsLayer);

