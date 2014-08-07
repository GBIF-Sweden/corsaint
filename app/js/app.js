'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'ngCookies',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers',
  'ui.bootstrap'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/index', {templateUrl: 'partials/index.html', controller: 'IndexCtrl'});
  $routeProvider.when('/form', {templateUrl: 'partials/searchForm.html', controller: 'SearchFormCtrl'});
  $routeProvider.when('/search', {templateUrl: 'partials/search.html', controller: 'SearchCtrl'});
  $routeProvider.when('/occurrence/dev', {templateUrl: 'partials/occurrence.html', controller: 'DevOccurrenceCtrl'});
  $routeProvider.when('/occurrence/:id/:version', {templateUrl: 'partials/occurrence.html', controller: 'OccurrenceCtrl'});
  $routeProvider.when('/occurrence/:id', {templateUrl: 'partials/occurrence.html', controller: 'OccurrenceCtrl'});
  $routeProvider.otherwise({redirectTo: '/index'});
}]);
