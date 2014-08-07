'use strict';

/* Directives */


angular.module('myApp.directives', [])
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
 .directive('analytics', ['$rootScope', '$location',
    function ($rootScope, $location) {
    return {
        link: function (scope, elem, attrs, ctrl) {
            $rootScope.$on('$routeChangeSuccess', function(event, currRoute, prevRoute) {
                ga('set', 'page', $location.path());
                ga('send', 'pageview');
            });
        }
    }
}]);;
