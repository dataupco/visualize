function mapService(mapId) {
  var that = this;  
  var map = L.map(mapId); // .locate({setView:true});

  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  /**
   * locate - use geolocation to center 
   */
  var locate = function() {
    map.locate({setView:true});
  };
  that.locate = locate;

  /**
   * moveTo - Move to location
   *
   * location : 
   *            x:int=longitude
   *            y:int=latitude
   *            z:int=zoom 
   */
  var moveTo = function(location) {
    if(location.z===undefined) location.z = 13; // default zoom
    map.setView([location.y,location.x],location.z);
    return that; 
  };
  that.moveTo = moveTo;
 
  /**
   * zoomIn - Zoom in on current location
   */
  var zoomIn = function() {
    map.zoomIn();i
    return that;
  };
  that.zoomIn = zoomIn;


  /**
   * zoomOut - Zoom out on current location
   */
  var zoomOut = function() {
    map.zoomOut();
    return that;
  };
  that.zoomOut = zoomOut;
 

  /**
   * Show popup message at location
   *
   *  location : 
   *            x:int=longitude
   *            y:int=latitude
   *  content : 
   *            message:string
   */
  var popUp = function(location,content) {
    var popup = L.popup()
      .setLatLng([location.y,location.x])
      .setContent(content.message)
      .openOn(map);
  };
  that.popUp = popUp;

  /**
   * Load geo json
   *
   * data : geo json data
   * featureCallbacks : style(f), click(f), filter(f)
   */
  var loadGeoJson = function(data,featureCallbacks) {
    var geojsonMarkerOptions = function(f) {

      if(featureCallbacks.marker) {
        return featureCallbacks.marker(f)
      }

      return {
        radius: 5,
        fillColor: featureCallbacks.style(f).color,
        color: 'black',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      };
    };

    L.geoJson(data, {  
      style: function (feature) {
        if(featureCallbacks.style) {
          return featureCallbacks.style(feature);
        }
        return {color: feature.properties.color};
      },
      onEachFeature: function (feature, layer) {
        if(featureCallbacks.content) {
          layer.bindPopup(featureCallbacks.content(feature));
        }
        else {
          layer.bindPopup(feature.properties.name); 
        }
      },
      filter: function(feature, layer) {
        if(featureCallbacks.filter) {
          return featureCallbacks.filter(feature);
        }
        else {
          return true;
        }
      },
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions(feature));
      }
    }).addTo(map);
  };
  that.loadGeoJson = loadGeoJson;


  return that;
};
