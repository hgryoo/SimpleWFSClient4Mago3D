function computeCircle(radius) {
  var positions = [];
  for (var i = 90; i < 91; i++) {
    var radians = Cesium.Math.toRadians(i);
    positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
  }
  return positions;
}

function geometryToGML(primitive) {
  var polyline = new Cesium.PolylineGeometry({
    positions : Cesium.Cartesian3.fromDegreesArray([-75, 35,
                                                    -125, 35]),
    width : 10.0
  });
  var geom = Cesium.PolylineGeometry.createGeometry(polyline);

  var volumeOutline = new Cesium.PolylineVolumeOutlineGeometry({
    polylinePositions : geom
  });

  var instance = new Cesium.GeometryInstance({
    geometry : volumeOutline
  })

  var prim = viewer.scene.primitives.add(new Cesium.Primitive({
    geometryInstances : instance,
    appearance : new Cesium.PolylineMaterialAppearance({
      material : Cesium.Material.fromType('Color')
    })
  }));

  viewer.zoomTo(prim);
}

function pointsToPolyline(points) {
  var gml = "<gml:LineString>";
    for(i in points) {
      gml += "<gml:pos>" + (points[i][0]) + " " + (points[i][1]) + " " + (points[i][2] / 0.3048) + "</gml:pos>";
    }
  gml += "</gml:LineString>";
  return gml;
}

function pointsToPolygon(points) {
  var gml = "<gml:Surface><gml:patches>";
  
  for(var i = 0; i < points.length; i = i + 3) {
  	gml += "<gml:PolygonPatch><gml:exterior><gml:LinearRing>";
  	for(var j = 0; j < 3; j++) {
  		gml += "<gml:pos>" + (points[i + j][0]) + " " + (points[i + j][1]) + " " + (points[i + j][2] / 0.3048) + "</gml:pos>";
  	}
  	gml += "<gml:pos>" + (points[i][0]) + " " + (points[i][1]) + " " + (points[i][2] / 0.3048) + "</gml:pos>";
  	gml += "</gml:LinearRing></gml:exterior></gml:PolygonPatch>";
  }
  
  gml += "</gml:patches></gml:Surface>";
  return gml;
}

function pointsToSolid(carto, height) {
  var gml = "<gml:Solid srsName=\"EPSG:4329\" srsDimension=\"3\"><gml:exterior><gml:CompositeSurface>";

  var lower = carto;
  var upper = [];
  for(i in lower) {
    lower[i].height = 0;
    upper.push(new Cesium.Cartographic(lower[i].longitude, lower[i].latitude, height));
  }

  var rev = lower.slice(0).reverse();
  gml += "<gml:surfaceMember>";
  gml += pointsToPolygon(rev);
  gml += "</gml:surfaceMember>";
  gml += "<gml:surfaceMember>";
  gml += pointsToPolygon(upper);
  gml += "</gml:surfaceMember>";

  for(var i = 0; i < lower.length; i++) {
    gml += "<gml:surfaceMember>";
    var points = [lower[i], lower[(i + 1) % lower.length], upper[i]];
    gml += pointsToPolygon(points);
    gml += "</gml:surfaceMember>";

    gml += "<gml:surfaceMember>";
    var points = [upper[i], lower[(i + 1) % lower.length], upper[(i + 1) % lower.length]];
    gml += pointsToPolygon(points);
    gml += "</gml:surfaceMember>";
  }
  gml += "</gml:CompositeSurface></gml:exterior></gml:Solid>";
  return gml;
}

function changeLabel(isShow, input, result) {
	$("input:radio[name='labelInfo']:radio[value='" + isShow + "']").prop("checked", true);
	changeLabelAPI(managerFactory, isShow);
       
        if(isShow) {
	     return resultPoint  =  getCoordinateRelativeToBuildingAPI (managerFactory, "workshop.json", "buildings", input,  result ); 
             //return resultPoint  =  getAbsoluteCoodinateOfBuildingPointAPI (managerFactory, "workshop.json", "buildings", input,  result ); 
        }
}

function filter(propertyName, filterType, geomType, points, height) {
  var filterTemplate = "<ogc:Filter> \
    <ogc:" + filterType + "> ";

    if(propertyName instanceof Array) {
      for(i in propertyName) {
        filterTemplate += "<ogc:PropertyName>" + propertyName[i] + "</ogc:PropertyName> ";
      }
    } else {
      filterTemplate += "<ogc:PropertyName>" + propertyName + "</ogc:PropertyName> ";
    }

    var queryGeom;

    var EPSG_4326 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
    var EPSG_2263 = "+proj=lcc +lat_1=41.03333333333333 +lat_2=40.66666666666666 +lat_0=40.16666666666666 +lon_0=-74 +x_0=300000.0000000001 +y_0=0 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs";

    /*
    realPoints = []
    var carto = Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(points);
    for(var i in cartoPoints) {
	result = proj4(EPSG_4326, EPSG_2263, [cartoPoints[i][0], cartoPoints[i][1]]);
	newP = [result[0], result[1], cartoPoints[i][2]];
	//getCoordinateRelativeToBuildingAPI (managerFactory, "workshop.json", "buildings", points[i], newP );
	realPoints.push(newP);
    }
    //var carto = Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(points);
    
    console.log(realPoints)
    */

    if(geomType == "Polyline") {
    	queryGeom = pointsToPolyline(cartoPoints);
    } else if(geomType == "Polygon") {
    	var concatArr = []
    	for(var i = 0; i < cartoPoints.length; i++) {
    		concatArr = concatArr.concat(cartoPoints[i]);
    	}
    	var triangulatedPoints = triangulate(concatArr, []);
    	queryGeom = pointsToPolygon(triangulatedPoints);
    } else if(geomType == "Solid") {
    queryGeom = pointsToSolid(realPoints, height);
    }
    
    console.log(queryGeom);
    
    filterTemplate += queryGeom;

    filterTemplate += "</ogc:" + filterType + "> \
    </ogc:Filter>";
    return filterTemplate;
}

function triangulate(myvertices, interior) {
	partition = []
	var triangle = earcut(myvertices, null, 3);
	for(var i = 0; i < triangle.length; i++) {
		partition.push([ myvertices[triangle[i] * 3], myvertices[triangle[i] * 3 + 1], myvertices[triangle[i] * 3 + 2] ]);
	}
	
	return partition;
}
