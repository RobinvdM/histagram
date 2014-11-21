"use strict"

var app = {
    api: "http://kulturnett2.delving.org/api/search?query=abm_type_text%3Astillimage&qf=delving_hasGeoHash%3Atrue&qf=abm_municipality_text%3AOslo&format=json&qf[]=dc_subject_facet:Veier",
    set: {},
    init: function() {
        app.loadPhotos();
    },
    loadPhotos: function() {
        var page = Math.round(Math.random() * 100);
        $.getJSON(app.api + '&start=' + page, function(data) {
            app.set = {};
            do {
                var rand = Math.round(Math.random() * 10);
                if (typeof app.set[rand] != 'undefined') continue; // Make sure a picture is only picked once

                app.set[rand] = {
                    latlong: data['result']['items'][rand]['item']['fields']['abm_latLong'][0],
                    title:   data['result']['items'][rand]['item']['fields']['dc_title'][0],
                    url:     data['result']['items'][rand]['item']['fields']['delving_thumbnail'][0],
					url2:     data['result']['items'][rand]['item']['fields']['europeana_isShownBy'][0]
                };
            } while (Object.keys(app.set).length < 3);

            app.displayPhotos();
            app.quiz();
        });
    },
    loadStreetview: function(latlong) {
        var bryantPark = new google.maps.LatLng(latlong[0],latlong[1]);
        var panoramaOptions = {
            position: bryantPark,
            pov: {
              heading: 165,
              pitch: 0
            },
            zoom: 1,
			scrollwheel: false
        };
        var myPano = new google.maps.StreetViewPanorama(
              document.getElementById('map-canvas'),
              panoramaOptions);
        myPano.setVisible(true);
    },
    displayPhotos: function() {
        var n = 0;
        $.each(app.set, function(i,photo) {
            $('#p' + ++n).html(
                $('<img>', {'src': photo.url2, 'width':400,'height':400})
            );
        });
    },
    quiz: function() {
        var pic = Math.floor(Math.random() * 3);
console.log(app.set[Object.keys(app.set)[pic]].latlong);
        app.loadStreetview(app.set[Object.keys(app.set)[pic]].latlong.split(','));
    }

};
app.init();