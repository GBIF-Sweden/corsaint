'use strict';

/* Services */

angular.module('myApp.services', ['ngResource'])
.factory('IndexSize', ['$resource',
    function($resource) {
        return $resource(baseUrl + wsPath + 'izeure/size', {}, {
            query:{method:'GET', isArray:false, cache:true}                    
        });
    }
])
.factory('searchOccurrences',['$resource',
    function($resource){
        return $resource(baseUrl + wsPath + 'search/occurrences',{}, {
            post:{method:'POST', params:{}, isArray:false}
        });
    }
])
.factory('downloadOccurrences',['$resource',
    function($resource){
        return $resource(baseUrl + wsPath + 'download/occurrences',{}, {
            get:{method:'GET', params:{}}        
        });
    }
])
.factory('getOccurrence',['$resource',
    function($resource){
        return $resource(baseUrl + wsPath + 'occurrence/:id/json',{id:'@id'});
    }
])
.factory('getOccurrenceVersion',['$resource',
    function($resource){
        return $resource(baseUrl + wsPath + 'occurrence/:id/:version/json',{id:'@id',version:'@version'});
    }
])
.factory('getTranslation',['$resource', 
    function($resource){
        return $resource('translations/translation_:lang.json',{lang:'@lang'});
    }
])
.factory('getDevOccurrence',['$resource',
    function($resource){
        return $resource('dev/devOccurrence.json');
    }
])
.factory('helper', function() { 
    return {
        serialize : function(obj, prefix){
            var str = [];
            for(var p in obj) {
              var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
              str.push(typeof v === "object" ?
                serialize(v, k) :
                encodeURIComponent(k) + "=" + encodeURIComponent(v));
            }
            return str.join("&");        
        }
    }
})
.value('version', '0.1');