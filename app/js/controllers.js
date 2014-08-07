'use strict';

angular.module('myApp.controllers', []).
controller('IndexCtrl',['$scope', '$location', 'IndexSize', function($scope,$location,IndexSize) {
    $scope.izeure = IndexSize.query();  
    
    $scope.query = {};
    $scope.searchSpecies = function() {
        console.log("Starting searching...");
        var params={}
        $location.path("form").search($scope.query);
    }    
    $scope.toForm = function () {
        $location.path('/form');
    }
}])
//@todo: the controller below should be replaced with a service.
.controller('TypeaheadCtrl',['$scope','$http', function($scope,$http) {
        
    $scope.getNames = function(val) {
        return $http.get('http://api.gbif.org/v0.9/species/suggest?datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c', {
            params:{
                q: val
            }
        }).then(function(res){
            var names = [];
            angular.forEach(res.data, function(item){
                names.push(item.canonicalName);
            });
            return names;
        });
    };
}])
.controller('SearchFormCtrl',['$scope','$http', '$location', '$cookies',
function($scope,$http, $location, $cookies) {

    function formatDate(datum) {
        var day = datum.getDate().toString();
        var month = (datum.getMonth() + 1).toString();
        if(day.length < 2) day = '0' + day;
        if(month.length < 2) month = '0' + month;
        return datum.getFullYear() + '-' + month + '-' + day;
    }
                
    $scope.query = {};
    $scope.query.offset = 1;
    $scope.isCollapsed = true;
    document.getElementById("autofocus").focus();
    
    $scope.searchParams = $location.search();
    if(typeof $scope.searchParams.scientificName !== 'undefined'){
        $scope.query.scientificName = $scope.searchParams.scientificName;
        console.log("param: "+$scope.dwc_scientificName);
    }

    $scope.searchSpecies = function() {
        console.log("Starting searching...");
        if(typeof $scope.eventDateLow !== 'undefined') {
            $scope.query.eventDateLow = formatDate($scope.eventDateLow);
        }
        if(typeof $scope.eventDateHigh !== 'undefined') {
            $scope.query.eventDateHigh = formatDate($scope.eventDateHigh);
        }
        var params={};
        //keep the form data for history
        var form = angular.toJson($scope.query);
        console.log("Save cookie "+ form);
        $cookies.corsaint_form = form;
        
        $location.path("search").search($scope.query);
    }    
    
    $scope.today = function() {
        $scope.eventDateLow = new Date();
        $scope.eventDateHigh = $scope.eventDateLow;
    };

    $scope.showWeeks = true;
    $scope.toggleWeeks = function () {
      $scope.showWeeks = ! $scope.showWeeks;
    };

    $scope.clear = function () {
      $scope.dt = null;
    };

    // Disable weekend selection
    $scope.disabled = function(date, mode) {
      return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
    };

    $scope.toggleMax = function() {
      $scope.maxDate = ( $scope.maxDate ) ? null : new Date();
    };
    $scope.toggleMax();

    $scope.open = function($event, opened) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope[opened] = true;
    };

    $scope.dateOptions = {
      'year-format': "'yy'",
      'starting-day': 1
    };

    $scope.formats = ['yyyy-MM-dd','dd-MMMM-yyyy', 'yyyy/MM/dd', 'shortDate'];
    $scope.format = $scope.formats[0];    
    
}])
.controller('MapSelectCtrl',['$scope',
function($scope){
    var map = L.map("map",{
        center: new L.LatLng(30,0),
        zoom: 2 ,
        zoomControl: false,
        layers: OpenStreetMap
    });
    // Stupid hack for forcing map redraw after hitting forward button
    // I suppose it's because the map is drawn on a partial view
    map.removeLayer(OpenStreetMap);
    map.addLayer(OpenStreetMap, true);
    // End of Stupid hack

    L.control.layers(maps).addTo(map);
    L.control.zoom({position: 'topright'}).addTo(map);
    L.control.scale({metric:true, imperial: true, position: 'bottomright'}).addTo(map);
    
    // Initialise the FeatureGroup to store editable layers
    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Initialise the draw control and pass it the FeatureGroup of editable layers
    var drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
            polyline: false,
            polygon: false,
            circle: false,
            marker: false  
        },
        edit: {
            featureGroup: drawnItems
        }
    });
    map.addControl(drawControl); 
    
    // Keep visible the box drawn
    map.on('draw:created', function (e) {
        var type = e.layerType,
            layer = e.layer;
        drawnItems.addLayer(layer);

        function getBoundingBox(tableau) {
            var ne = {lat:-90,lng:-180},
                sw = {lat:90,lng:180};
        
            tableau.forEach(function(entree){
                if(entree.lat >= ne.lat && entree.lng >= ne.lng)
                    ne = entree;
                if(entree.lat <= sw.lat && entree.lng <= sw.lng)
                    sw = entree;
            });
            
            console.log("North East: "+ne.lat+", "+ne.lng);
            console.log("South West: "+sw.lat+", "+sw.lng);
            
            return {ne: ne.lat+","+ne.lng, sw: sw.lat+","+sw.lng};
        }
        
        var bbox = getBoundingBox(layer.getLatLngs());
        $scope.$parent.query.bb_ne = bbox.ne;
        $scope.$parent.query.bb_sw = bbox.sw;
        
    });      
}])
.controller('SearchCtrl',['$scope', '$location', 'searchOccurrences', 'downloadOccurrences', '$resource','helper',
function($scope, $location, searchOccurrences, downloadOccurrences, $resource, helper) {
    $scope.searchParams = $location.search(); // get the search object, ie. a list of key-value pairs
    console.log("species: "+$scope.searchParams.scientificName);
    console.log("country: "+$scope.searchParams.country);
    console.log("eventDate.low: " + $scope.searchParams.eventDateLow);
    console.log("eventDate.high: " + $scope.searchParams.eventDateHigh);
    
    $scope.itemPerPage = 100;
    $scope.maxSize = 7;
    $scope.dwc_scientificName = $scope.searchParams.scientificName;
    $scope.dataLoaded = false;                  //is the data loaded?
    $scope.sortCol = 1;                         // default sort column
    console.log("controller loaded");

    var localParams = {};
    localParams.dwc_scientificName = $scope.searchParams.scientificName;
    localParams.dwc_basisOfRecord = $scope.searchParams.basisOfRecord;
    localParams.dwc_country = $scope.searchParams.country;
    localParams.dwc_continent = $scope.searchParams.continent;
    localParams.dwc_stateProvince = $scope.searchParams.stateProvince;
    localParams.dwc_county = $scope.searchParams.county;
    localParams.dwc_catalogNumber = $scope.searchParams.catalogNumber;
    localParams.dwc_recordedBy = $scope.searchParams.recordedBy;
    localParams.dwc_fieldNumber = $scope.searchParams.fieldNumber;
    localParams.dwc_identifiedBy = $scope.searchParams.identifiedBy;
    localParams.dwc_institutionCode = $scope.searchParams.institutionCode;
    localParams.dwc_collectionCode = $scope.searchParams.collectionCode;
    localParams.eventDateLow = $scope.searchParams.eventDateLow;
    localParams.eventDateHigh = $scope.searchParams.eventDateHigh;
    localParams.bb_ne = $scope.searchParams.bb_ne;
    localParams.bb_sw = $scope.searchParams.bb_sw;
    localParams.page = $scope.searchParams.offset-1;
    localParams.size = $scope.itemPerPage;    
    // default sort
    localParams.sort = 'dwc_scientificName,dwc_institutionCode,dwc_collectionCode,dwc_catalogNumber';
    localParams.order = "asc";
    
    $scope.results = searchOccurrences.post(localParams, function(data){
        // gets only once the total number of matches, otherwise this will
        // mess with the pagination directive
        $scope.matches = data["matches"];
        $scope.dataLoaded = true;
        // since we loaded data and updated total-items of the pagination 
        // directive, we need to tell it which page it should mark as displayed
        // but this will trigger $watch()
        $scope.currentPage = $scope.searchParams.offset; 
    });
    
    var linkParams = localParams.constructor();
    for (var key in localParams) {
        if(typeof localParams[key] !== "undefined" && key!=="size" && key!=="order" && key !=="page" && key !== "sort") {
            linkParams[key] = localParams[key];
        }
    }
    
    $scope.downloadURL = baseUrl+ wsPath +"download/occurrences?"+helper.serialize(linkParams);
    $scope.download = function() {
        console.log("test "+localParams.dwc_scientificName);
        downloadOccurrences.get(localParams);
    };
    
    $scope.changeSort = function(col,columns) {
        $scope.sortCol = col;
        
        if(localParams.sort !== columns) {           // another column clicked
            localParams.sort = columns;
            localParams.order = "asc";
        } else if(localParams.order === "asc") {
            localParams.order = "desc";
        } else {
            localParams.order = "asc";
        }
        // we reload the complete stuff so offset is first page
        localParams.page = 0;
        $scope.results = searchOccurrences.post(localParams, function(data){
            // gets only once the total number of matches, otherwise this will
            // mess with the pagination directive
            $scope.matches = data["matches"];
            $scope.dataLoaded = true;
        });        
    }
    
    $scope.sorted = function(col) {
        return col === $scope.sortCol ? 'bg-warning' : '';
    }
    
    $scope.$watch('currentPage', function(newPage,oldPage){
        if($scope.dataLoaded !== true)
            // Watching currentPage if no data loaded will result in extra 
            // but useless redirects. Out!
            return;
        if(newPage === $scope.searchParams.offset) {
            // newPage is the same as the offset in the URL, get out for not
            // making an extra redirect.
            return;
        }
        console.log("new page: "+newPage);
        console.log("old page: "+oldPage);
        $scope.searchParams.offset = newPage||1;
        $location.path("search").search($scope.searchParams);
    });
}])
.controller('OccurrenceCtrl',['$scope', '$routeParams', 'getOccurrence','getOccurrenceVersion',
function($scope, $routeParams,getOccurrence,getOccurrenceVersion){
    console.log('Get occurrence '+$routeParams.id);
    
    /***
     * Checks if which kind of DarwinCore data the occurrence has so we can  
     * display the correct sections
     * @param array tableau the DarwinCore concepts to check the occurrence against
     * @param string msg name of the section to be logged in the console
     * @returns true if some of the occurrence data matches the darwincore section
     */
    function checkSection(tableau, msg) {
        for (var key = 0; key < tableau.length; ++key) {
            if($scope.occurrence[tableau[key]]) {
                console.log(msg+"Section true");
                return true;
            }
        }
    }    
    if($routeParams.version > 0) {
        console.log('Get occurrence version '+$routeParams.version);
        getOccurrenceVersion.get({id:$routeParams.id, version:$routeParams.version}, function(data){
            // default sections values, none of them to be displayed unless 
            // the occurrence has some corresponding data
            $scope.recordSection = false;
            $scope.occurrenceSection = false;
            $scope.eventSection = false;
            $scope.locationSection = false;
            $scope.geologicalContextSection = false;
            $scope.identificationSection = false;
            $scope.taxonSection = false;
            
            //version
            $scope.version = $routeParams.version;
            
            // define sections
            var record = ["dc:type","dc:modified","dc:language","dc:rights","dc:rightsHolder","dc:accessRights","dc:bibliographicCitation","dc:references",
                            "dwc:institutionID","dwc:collectionID","dwc:datasetID","dwc:institutionCode","dwc:collectionCode","dwc:datasetName",
                            "dwc:ownerInstitutionCode","dwc:basisOfRecord","dwc:informationWithheld","dwc:dataGeneralizations","dwc:dynamicProperties"];
            var occurrence = ["dwc:occurrenceID","dwc:catalogNumber","dwc:occurrenceRemarks","dwc:recordNumber","dwc:recordedBy","dwc:individualID",
                                "dwc:individualCount","dwc:sex","dwc:lifeStage","dwc:reproductiveCondition","dwc:behavior","dwc:establishmentMeans",
                                "dwc:occurrenceStatus","dwc:preparations","dwc:disposition","dwc:otherCatalogNumbers","dwc:previousIdentifications",
                                "dwc:associatedMedia","dwc:associatedReferences","dwc:associatedOccurrences","dwc:associatedSequences","dwc:associatedTaxa"];
            var event = ["dwc:eventID","dwc:samplingProtocol","dwc:samplingEffort","dwc:eventDate","dwc:eventTime","dwc:startDayOfYear","dwc:endDayOfYear",
                            "dwc:year","dwc:month","dwc:day","dwc:verbatimEventDate","dwc:habitat","dwc:fieldNumber","dwc:fieldNotes","dwc:eventRemarks"];
            var location = ["dwc:locationID","dwc:higherGeographyID","dwc:higherGeography","dwc:continent","dwc:waterBody","dwc:islandGroup","dwc:island",
                            "dwc:country","dwc:countryCode","dwc:stateProvince","dwc:county","dwc:municipality","dwc:locality","dwc:verbatimLocality",
                            "dwc:verbatimElevation","dwc:minimumElevationInMeters","dwc:maximumElevationInMeters","dwc:verbatimDepth","dwc:minimumDepthInMeters",
                            "dwc:maximumDepthInMeters","dwc:minimumDistanceAboveSurfaceInMeters","dwc:maximumDistanceAboveSurfaceInMeters","dwc:locationAccordingTo",
                            "dwc:locationRemarks","dwc:verbatimCoordinates","dwc:verbatimLatitude","dwc:verbatimLongitude","dwc:verbatimCoordinateSystem",
                            "dwc:verbatimSRS","dwc:decimalLatitude","dwc:decimalLongitude","dwc:geodeticDatum","dwc:coordinateUncertaintyInMeters",
                            "dwc:coordinatePrecision","dwc:pointRadiusSpatialFit","dwc:footprintWKT","dwc:footprintSRS","dwc:footprintSpatialFit","dwc:georeferencedBy",
                            "dwc:georeferencedDate","dwc:georeferenceProtocol","dwc:georeferenceSources","dwc:georeferenceVerificationStatus","dwc:georeferenceRemarks"];
            var geologicalContext = ["dwc:geologicalContextID","dwc:earliestEonOrLowestEonothem","dwc:latestEonOrHighestEonothem","dwc:earliestEraOrLowestErathem",
                                        "dwc:latestEraOrHighestErathem","dwc:earliestPeriodOrLowestSystem","dwc:latestPeriodOrHighestSystem",
                                        "dwc:earliestEpochOrLowestSeries","dwc:latestEpochOrHighestSeries","dwc:earliestAgeOrLowestStage","dwc:latestAgeOrHighestStage",
                                        "dwc:lowestBiostratigraphicZone","dwc:highestBiostratigraphicZone","dwc:lithostratigraphicTerms","dwc:group","dwc:formation",
                                        "dwc:member","dwc:bed"];
            var identification = ["dwc:identificationID","dwc:identifiedBy","dwc:dateIdentified","dwc:identificationReferences","dwc:identificationVerificationStatus",
                                    "dwc:identificationRemarks","dwc:identificationQualifier","dwc:typeStatus"];
            var taxon = ["dwc:taxonID","dwc:scientificNameID","dwc:acceptedNameUsageID","dwc:parentNameUsageID","dwc:originalNameUsageID","dwc:nameAccordingToID",
                            "dwc:namePublishedInID","dwc:taxonConceptID","dwc:scientificName","dwc:acceptedNameUsage","dwc:parentNameUsage","dwc:originalNameUsage",
                            "dwc:nameAccordingTo","dwc:namePublishedIn","dwc:namePublishedInYear","dwc:higherClassification","dwc:kingdom","dwc:phylum","dwc:class",
                            "dwc:order","dwc:family","dwc:genus","dwc:subgenus","dwc:specificEpithet","dwc:infraspecificEpithet","dwc:taxonRank","dwc:verbatimTaxonRank",
                            "dwc:scientificNameAuthorship","dwc:vernacularName","dwc:nomenclaturalCode","dwc:taxonomicStatus","dwc:nomenclaturalStatus","dwc:taxonRemarks"];
            
            $scope.occurrence = data["dwr:SimpleDarwinRecord"];

            //check if record data
            $scope.recordSection = checkSection(record,"record");
            
            //check if occurrence data
            $scope.occurrenceSection = checkSection(occurrence,"occurrence");
            
            //check if event data
            $scope.eventSection = checkSection(event,"event");

            //check if location data
            $scope.locationSection = checkSection(location,"location");

            //check if geologicalContext data
            $scope.geologicalContextSection = checkSection(geologicalContext,"geologicalContext");

            //check if identification data
            $scope.identificationSection = checkSection(identification,"identification");

            //check if taxon data
            $scope.taxonSection = checkSection(taxon,"taxon");

            if($scope.locationSection) {
                var lat = $scope.occurrence["dwc:decimalLatitude"];
                var lng = $scope.occurrence["dwc:decimalLongitude"];

                if(lat && lng) {
                    $scope.showMap = true;
                    var map = L.map("map",{
                        center: new L.LatLng(lat,lng),
                        zoom: 11,
                        zoomControl: false,
                        scrollWheelZoom: false,
                        layers: OpenStreetMap
                    });
                    // Stupid hack for forcing map redraw after hitting forward button
                    // I suppose it's because the map is drawn on a partial view
                    map.removeLayer(OpenStreetMap);
                    map.addLayer(OpenStreetMap, true);
                    // End of Stupid hack

                    L.control.layers(maps, layers).addTo(map);
                    L.control.zoom({position: 'topright'}).addTo(map);
                    L.control.scale({metric:true, imperial: true}).addTo(map);
                    L.marker([lat,lng]).addTo(map);

                } else {
                    // if there is no coordinates, remove the <div> which encapsulate the #map
                    document.getElementById('map').parentNode.parentNode.remove();
                    $scope.showMap = false;
                }
            } else {
                // if there is no location data, remove the complete location <div>
                // note: we cannot do this with ng-if because it breaks Leaflet
                document.getElementById('map').parentNode.parentNode.parentNode.remove();
                $scope.showMap = false;
            }
        });
    } else {
        console.log('Get last version of occurrence');
        $scope.occurrence = getOccurrence.get({id:$routeParams.id});
    }

}])
.controller('DevOccurrenceCtrl',['$scope', '$routeParams', 'getDevOccurrence',
function($scope, $routeParams,getDevOccurrence){
    console.log('Get dev occurrence ');
    $scope.occurrence = getDevOccurrence.get();
}])  
.controller('GeneralCtrl',['$scope','$cookies','$location','getTranslation',
function($scope,$cookies,$location,getTranslation){
    function changeMenuFlag(lang) {
        var flag;
        if(lang == "sv") 
            flag = "se";
        else if(lang == "en") 
            flag = "gb";
        else 
            flag = lang;
        document.getElementById("flagmenu").src="img/famfamfam-flags/"+flag+".png";
    }
    
    // set the language from cookie
    var lang;
    if($cookies.corsaint_lang)
        lang = $cookies.corsaint_lang;
    else {
        lang = "en";
        // set the cookie
        $cookies.corsaint_lang = lang;
    }
    changeMenuFlag(lang);
    $scope.translation = getTranslation.get({lang:lang});

    //function for changing language
    $scope.changeLanguage = function(lang) {
        $cookies.corsaint_lang = lang;
        changeMenuFlag(lang);
        $scope.translation = getTranslation.get({lang:lang});
    }
    $scope.navClass = function(page) {
        var currentRoute = $location.path().substring(1) || 'index';
        return page === currentRoute ? 'active' : '';
    }
}])
;