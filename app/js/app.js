var map;
var locationMarker;

var addressToFind;
var siteRadiusPolygon;

var soilDataURLString;
var soilDataCoordinates;
var soilDataFillColor;
var soilDataPolygonsArray;
var soilDataPolygons;
var soilDataBoolean = false;

$(document).ready(function()
{
  $('.navigationLink').on('mouseover', function()
  {
    $(this).find('.navigationIcon').css(
    {
      'fill': '#ffffff'
    })
  });
  $('.navigationLink').on('mouseleave', function()
  {
    $(this).find('.navigationIcon').css(
    {
      'fill': '#000000'
    })
  });
});

function initializeMap()
{
	map = new Microsoft.Maps.Map('#bingMap', 
	{
	    credentials: 'AlGvueuNZnD_urhJrwx4LVMS2ooL_rXC57QSlQ9hIsSJwpIXBgbx4Q6PLcCcx2Fp',
	    center: new Microsoft.Maps.Location(40, -98.5),
	    zoom: 4
	});

	var center = map.getCenter();

  var exteriorRing = 
  [
    center,
    new Microsoft.Maps.Location(center.latitude, center.longitude),
    new Microsoft.Maps.Location(center.latitude, center.longitude),
    center
  ];

	locationMarker = new Microsoft.Maps.Pushpin(center);
  siteRadiusPolygon = new Microsoft.Maps.Polygon(exteriorRing, 
  {
    strokeColor: 'rgba(255, 246, 148, 0)',
    fillColor: 'rgba(200, 255, 183, 77)',
    strokeThickness: 2,
  });

	map.entities.push(locationMarker);
  map.entities.push(siteRadiusPolygon);

  soilDataURLString = 'https://stormwatercalc.attaincloud.com/swcalculator-server/api/v1/soils?latitude=' + locationMarker.getLocation().latitude + '&longitude=' + locationMarker.getLocation().longitude + '&distance=1000';
}

function MakeGeocodeRequest(credentials)
{
  var geocodeRequest = 'https://dev.virtualearth.net/REST/v1/Locations/' + addressToFind + '?output=json&jsonp=GeocodeCallback&key=' + credentials;

  CallRestService(geocodeRequest);
}

function GeocodeCallback(result) 
{
  if (result &&
      result.resourceSets &&
      result.resourceSets.length > 0 &&
      result.resourceSets[0].resources &&
      result.resourceSets[0].resources.length > 0) 
  {
    var bbox = result.resourceSets[0].resources[0].bbox;
    var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(new Microsoft.Maps.Location(bbox[0], bbox[1]), new Microsoft.Maps.Location(bbox[2], bbox[3]));
               
    map.setView(
    { 
      bounds: viewBoundaries
    });

    var location = new Microsoft.Maps.Location(result.resourceSets[0].resources[0].point.coordinates[0], result.resourceSets[0].resources[0].point.coordinates[1]);

    map.setView(
    {
      center: location,
      zoom: 18
    });

    center = map.getCenter();

    map.entities.remove(locationMarker);

    locationMarker = new Microsoft.Maps.Pushpin(center);

    map.entities.push(locationMarker);

    soilDataURLString = 'https://stormwatercalc.attaincloud.com/swcalculator-server/api/v1/soils?latitude=' + locationMarker.getLocation().latitude + '&longitude=' + locationMarker.getLocation().longitude + '&distance=1000';

   }
}

function CallRestService(request) 
{
  var script = document.createElement('script');

  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', request);

  document.body.appendChild(script);
}

function drawSiteRadius()
{
  var earthRadius = 3185.5;

  var lat = (locationMarker.getLocation().latitude * Math.PI) / 180;
  var lon = (locationMarker.getLocation().longitude * Math.PI) / 180;
  var distance = siteRadius / earthRadius;
  var points = new Array();

  for (var i = 0; i <= 360; i++)
  {
    var p2 = new Microsoft.Maps.Location(0, 0);
    brng = i * Math.PI / 180;

    p2.latitude = Math.asin(Math.sin(lat) * Math.cos(distance) + Math.cos(lat) * Math.sin(distance) * Math.cos(brng));
    p2.longitude = ((lon + Math.atan2(Math.sin(brng) * Math.sin(distance) * Math.cos(lat),
                    Math.cos(distance) - Math.sin(lat) * Math.sin(p2.latitude))) * 180) / Math.PI;
    p2.latitude = (p2.latitude * 180) / Math.PI;
    points.push(p2);
  }
  siteRadiusPolygon.setLocations(points);
}

function getSoilData(page)
{
  if (soilDataBoolean == false)
  {
    $('#loadingDiv').fadeIn(400);

    $.ajax(
    {
      type: 'GET',
      url: soilDataURLString,
      async: true,
      dataType: 'json',
      success: function(response)
      {
        $('#loadingDiv').fadeOut(400);

        soilDataPolygonsArray = [];
        soilDataBoolean = true;

        for (var i = 0; i < response.length; i++)
        {
          soilDataCoordinates = [];

          if (page == 'soiltype')
          {
            if (response[i].soilGroup == 'A')
            {
              soilDataFillColor = 'rgba(255, 235, 59, 0.6)';
            }
            if (response[i].soilGroup == 'B')
            {
              soilDataFillColor = 'rgba(255, 128, 171, 0.6)';
            }
            if (response[i].soilGroup == 'C')
            {
              soilDataFillColor = 'rgba(126, 87, 194, 0.6)';
            }
            if (response[i].soilGroup == 'D')
            {
              soilDataFillColor = 'rgba(1, 87, 155, 0.6)';
            }
          }
          if (page == 'soildrainage')
          {
            if (response[i].ksat <= 0.01)
            { 
              soilDataFillColor = 'rgba(255, 235, 59, 0.6)';
            }
            if ((response[i].ksat > 0.01) && (response[i].ksat <= 0.1))
            { 
              soilDataFillColor = 'rgba(255, 128, 171, 0.6)';
            }
            if ((response[i].ksat > 0.1) && (response[i].ksat <= 1))
            { 
              soilDataFillColor = 'rgba(126, 87, 194, 0.6)';
            }
            if (response[i].ksat > 1)
            { 
              soilDataFillColor= 'rgba(1, 87, 155, 0.6)';
            }
          }

          if (Object.keys(response[i]).length != 0)
          {
            for (var j = 0; j < response[i].polygons[0].coord.length; j++)
            {
              var lat = response[i].polygons[0].coord[j].y;
              var lon = response[i].polygons[0].coord[j].x;

              soilDataCoordinates.push(new Microsoft.Maps.Location(lat,lon));
            }
          }

          soilDataPolygons = new Microsoft.Maps.Polygon(soilDataCoordinates,
          {
            fillColor: soilDataFillColor,
            strokeColor: '#000000'
          });

          soilDataPolygons.soilGroup = response[i].soilGroup;
          soilDataPolygons.ksat = response[i].ksat;

          soilDataPolygonsArray.push(soilDataPolygons);
        }

        map.entities.push(soilDataPolygonsArray);
      }
    });
  }
}

function hidePolygons()
{
  if (soilDataBoolean == true)
  {
    for (var i = 0; i < soilDataPolygonsArray.length; i++)
    {
      soilDataPolygonsArray[i].setOptions(
      {
        visible: false
      });
    }
  }
}

function showPolygons()
{
  if (soilDataBoolean == true)
  {
    for (var i = 0; i < soilDataPolygonsArray.length; i++)
    {
      soilDataPolygonsArray[i].setOptions(
      {
        visible: true
      });
    }
  }
}

var app = angular.module("stormwaterCalculator", ["ngRoute"]);

app.config(function($routeProvider)
{
	$routeProvider.when("/location", 
	{
		templateUrl: "/modals/location.html",
    controller: "locationCtrl",
    resolve:
    {
      check: function()
      {
        hidePolygons();
      }
    }
	}).when("/soiltype", 
	{
		templateUrl: "/modals/soiltype.html",
    controller: "soildataCtrl",
    resolve:
    {
      check: function()
      {
        getSoilData('soiltype');

        if (soilDataBoolean == true)
        {
          for (var i = 0; i < soilDataPolygonsArray.length; i++)
          {
            if (soilDataPolygonsArray[i].soilGroup == 'A')
            { 
              soilDataPolygonsArray[i].setOptions(
              {
                fillColor: 'rgba(255, 235, 59, 0.6)'
              });
            }
            if (soilDataPolygonsArray[i].soilGroup == 'B')
            { 
              soilDataPolygonsArray[i].setOptions(
              {
                fillColor: 'rgba(255, 128, 171, 0.6)'
              });
            }
            if (soilDataPolygonsArray[i].soilGroup == 'C')
            { 
              soilDataPolygonsArray[i].setOptions(
              {
                fillColor: 'rgba(126, 87, 194, 0.6)'
              });
            }
            if (soilDataPolygonsArray[i].soilGroup == 'D')
            { 
              soilDataPolygonsArray[i].setOptions(
              {
                fillColor: 'rgba(1, 87, 155, 0.6)'
              });
            }
          }
        }
      }
    }
	}).when("/soildrainage", 
  {
    templateUrl: "/modals/soildrainage.html",
    controller: "soildataCtrl",
    resolve:
    {
      check: function()
      {
        getSoilData('soildrainage');

        if (soilDataBoolean == true)
        {
          for (var i = 0; i < soilDataPolygonsArray.length; i++)
          {
            if (soilDataPolygonsArray[i].ksat <= 0.01)
            { 
              soilDataPolygonsArray[i].setOptions(
              {
                fillColor: 'rgba(255, 235, 59, 0.6)'
              });
            }
            if ((soilDataPolygonsArray[i].ksat > 0.01) && (soilDataPolygonsArray[i].ksat <= 0.1))
            { 
              soilDataPolygonsArray[i].setOptions(
              {
                fillColor: 'rgba(255, 128, 171, 0.6)'
              });
            }
            if ((soilDataPolygonsArray[i].ksat > 0.1) && (soilDataPolygonsArray[i].ksat <= 1))
            { 
              soilDataPolygonsArray[i].setOptions(
              {
                fillColor: 'rgba(126, 87, 194, 0.6)'
              });
            }
            if (soilDataPolygonsArray[i].ksat > 1)
            { 
              soilDataPolygonsArray[i].setOptions(
              {
                fillColor: 'rgba(1, 87, 155, 0.6)'
              });
            }
          }
        }
      }
    }
  });
});

app.controller("navigationCtrl", function($scope, $location)
{
    $scope.go = function(path)
    {
      $location.path(path);
    }
});

app.controller("locationCtrl", function($scope)
{
    $scope.searchLocation = function(address)
    {
      addressToFind = address;
      map.getCredentials(MakeGeocodeRequest);
    }

    $scope.drawRadius = function(radius)
    {
      siteRadius = radius / 61.77625;
      drawSiteRadius(radius);
    }

    $scope.drawCustomArea = function()
    {
      if ($('#customAreaIcon').hasClass('active'))
      {
        $('#customAreaIcon').removeClass('active');

        $('#customAreaIcon').css(
        {
          'fill': '#7cb2ab'
        });

        $('#locationInput').prop('disabled', false);
        $('#acreInput').prop('disabled', false);
      }
      else
      {
        $('#customAreaIcon').addClass('active');

        $('#customAreaIcon').css(
        {
          'fill': '#ffb74d'
        });

        $('#locationInput').prop('disabled', true);
        $('#acreInput').prop('disabled', true);

        // Microsoft.Maps.loadModule('Microsoft.Maps.DrawingTools', function () 
        // {
        //     var tools = new Microsoft.Maps.DrawingTools(map);

        //     tools.showDrawingManager(function(manager)
        //     {
        //       manager.setOptions({});
        //       manager.setDrawingMode(Microsoft.Maps.DrawingTools.DrawingMode.polyline);
        //     });
        // });
      }
    }
});

app.controller('soildataCtrl', function($scope)
{
  $scope.hidePolygons = function()
  {
    if ($('#soilDataCheckbox').is(':checked'))
    {
      hidePolygons();
    }
    else
    {
      showPolygons();
    }
  }
});
