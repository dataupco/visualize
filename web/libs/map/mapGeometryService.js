function mapGeometryService() {
  var that = this;  
  var reader = new jsts.io.GeoJSONReader();
  
  var hasGeometry = function(feature) {
    var geometry = reader.read(feature).geometry;
    return geometry?true:false;
  };
  that.hasGeometry = hasGeometry;
       
  var getFeatureLength = function(feature) {
    try {
      var geometry = reader.read(feature).geometry;
      return geometry.getLength();
    }
    catch(e) {
      return 0;
    }
  };
  that.getFeatureLength = getFeatureLength;

  var getFeatureArea = function(feature) {
    try {
      var geometry = reader.read(feature).geometry;
      return geometry.getArea();
    }
    catch(e) {
      return 0;
    }
  };
  that.getFeatureArea = getFeatureArea;

  return that;
};
