corsaint
========

Corsaint is the web application developped and used by GBIF-Sweden for accessing 
data from its data warehouse through the dijon web services (see 
<a href="https://github.com/GBIF-Sweden/dijon/">https://github.com/GBIF-Sweden/dijon/</a>).

It is a multilingual application and the results of a request are presented in a 
table with sortable columns. It can be used by any other GBIF node or 
organisation in need of a data portal.

It is a HTML/Javascript application which relies on AngularJS 
(<a href="http://angularjs.org/">http://angularjs.org/</a>) and Bootstrap for 
AngularJS (<a href="http://angular-ui.github.io/bootstrap/">http://angular-ui.github.io/bootstrap/</a>).

You can see a live example here: <a href="http://gbif.naturfynd.se">http://gbif.naturfynd.se</a>.

Configuration
-------------
Open the file app/config.js and change the two variables baseURL with the URL of the 
server where dijon is installed, and wsPath with the path of the dijon 
application. By default its value is "dijon/", but if the installation is instead 
under "api/", the variable must be changed accordingly. Note that the trailing 
"/" is required.

CSS changes
-----------
All changes must be done in the file app/css/app.css. Don't touch the standard 
Bootstrap files unless you know what you are doing.

Front page changes
------------------
Menu changes and other information on your organisation, contacts etc. and menu 
are made in the file app/index.html. 
This is as well the place where to change the translation menu.

Translations
------------
With Corsaint it is possible to use multiple languages. Go in app/translations/, 
copy translation_en.json to translation_XX.json where XX are the two letters for
the language code, and then start to translate! 
Don't forget then to add your new language in app/index.html. 

In the unfortunate case of mismatch between your language code and the famfamfam 
flags icons (see app/img/famfamfam-flags/) you must update the function 
changeMenuFlag in app/js/controllers.js. 

Installation
------------
Simply copy the content of directory app/ into the root directory 
of your webserver. In Tomcat, it is on CATALINA_HOME/webapps/ROOT/.