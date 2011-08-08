var oxford = new google.maps.LatLng(51.7573795, -1.2463022);
var map;
var directionsService;
var gRoutes    = new Array(); // store google.maps.DirectionRoute objects
var gPolylines = new Array(); // store polyline overlays
var gMarkers   = new Array(); // store marker overlays
var searchRadius = 50; // in kilometers...

// Try to geolocate to center initial map... if geolocation fails
// then we default to centering on Oxford, England
function initialize()
{
    var mapOptions = {
            zoom: 9, //required
            center: oxford, //required
            mapTypeId: google.maps.MapTypeId.ROADMAP //required
    };

    map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
    directionService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map }); 


    if(navigator.geolocation)
    {
        navigator.geolocation.getCurrentPosition(gotGeolocation,noGeolocation,{'enableHighAccuracy':true,'timeout':5000,'maximumAge':0});
    }
    else
    {
        map.setCenter(oxford);
    }

    function gotGeolocation(pos)
    {
        var myLocation = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        map.setCenter(myLocation);
    }
    function noGeolocation(err)
    {
        map.setCenter(oxford);
    }

    google.maps.event.addListener(map, 'click', function(event) 
                                                {startHere(event.latLng); });
}


// makes the call to the google maps direction service to find
// a route from origin to a destination distance meters away on given heading
function addNewRoute( origin, distance, heading )
{
  var destination = google.maps.geometry.spherical.computeOffset( origin, distance, heading )

  var request = {
    origin: origin,
    destination: destination,
    travelMode: google.maps.DirectionsTravelMode.DRIVING
  }
  
  //alert("making request..." + request.origin + "   " + request.destination);
  directionService.route(request, 
                         function(result,status)
                         {
                             if (status == google.maps.DirectionsStatus.OK)
                             {
                                var route = pruneRoute( result.routes[0], distance );
                                //var route = result.routes[0];
                                gRoutes.push(route);

                                var routePolyline = 
                                               new google.maps.Polyline({
                                               path: route.overview_path,
                                               strokeColor: "#FF0000",
                                               strokeOpacity: 1.0,
                                               strokeWeight: 2,
                                               map: map });

                                gPolylines.push( routePolyline );
                             } 
                             else 
                             {
                                 //alert("Directions query failed: " + status);
                             }
                         });
}

// clears all the overlays and resets the global arrays
function clearAllRoutes()
{
    gPolylines.forEach( function( overlay, index, array ){ overlay.setMap(null); } );
    gMarkers.forEach( function( overlay, index, array ){ overlay.setMap(null); } );

    gPolylines.length = 0;
    gRoutes.length = 0;
    gMarkers.length = 0;
}

// finds routes from 'origin' to points on a circle of radius 'distance'
// every 'interval' degrees
function findRadiusRoutes( origin, distance, interval )
{
    for( var i = 0; i <= 360; i += interval )
    { addNewRoute( origin, distance, i ); }
}

// given a google.maps.DirectionsRoute object it chops waypoints off the
// end of it to make its length <= 'length'
function pruneRoute( route, length )
{
    var distance = 0;
    var waypoint = 1;
    while( distance < length && waypoint < route.overview_path.length )
    {
        distance += 
            google.maps.geometry.spherical.computeDistanceBetween( 
                                    route.overview_path[waypoint - 1],
                                    route.overview_path[waypoint] );

        waypoint += 1;
        //alert ("distance = " + distance + "  waypoint = " + waypoint);
    }
    
    //TODO this doesn't recalculate latlng bounds
    var pruned_route = route;
    pruned_route.legs          = pruned_route.legs.slice(0, waypoint);
    pruned_route.overview_path = pruned_route.overview_path.slice(0, waypoint);
    return pruned_route;
}

function startHere(location)
{
    marker = new google.maps.Marker({
             position: location,
             map: map
    });
    gMarkers.push(marker);

    searchRadius = parseInt( $('#distance_input').val() );
    findRadiusRoutes( location, searchRadius * 1000, 30);
}

// gets everything going once the page has loaded...
google.maps.event.addDomListener(window, 'load', initialize);

