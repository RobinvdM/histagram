"use strict"

var app = {
    questions: 10,
    init: function() {
        app.intro.show();
        app.data.load();
        app.quiz.init();

        $('#navigation div.pic').click(app.quiz.round.checkAnswer);
		$(document).click(app.intro.hide);
    },
    intro: {
        show: function() {
            $('div.intro').hide().fadeIn(200);
        },
        hide: function() {
            $('div.intro').fadeOut(200);
        }
    },
    data: {
        searches: ['Veier','Bygater','Parker','Bybebyggelse'],//,'Oversiktsbilder','Boliger','Bybebyggelse'], //'Bebyggelse','Bygninger'],//,
        api:      "http://kulturnett2.delving.org/api/search?rows=999999999&query=abm_type_text%3Astillimage&qf=delving_hasGeoHash%3Atrue&format=json",
        set:      [],

        load: function() {
            $.each(app.data.searches, function(i,term) {
                $.ajax({
                    url: app.data.api + '&qf[]=dc_subject_facet:' + term,
                    type: 'GET',
                    dataType: 'json',
                    async: false,
                    success: function(data) {
                        $.each(data.result.items, function(i,item) {
                            app.data.set.push(item);
                        });
                    }
                });
            });
        },
        get: function(i) {
            return i ? app.data.set[i].item.fields : app.data.set;
        }
    },
    quiz: {
        position: 1,
        score: 0,

        init: function() {
            app.quiz.round.init();
        },
        nextQuestion: function() {
            ++app.quiz.position;
            $('#n').html(app.quiz.position);

            app.quiz.round.init();
        },
        reset: function() {
            app.quiz.score = 0;
            app.quiz.position = 1;

            app.quiz.init();
        },
        addScore: function() {
            ++app.quiz.score;
            $('#c').html(app.quiz.position);
        },
        endscreen: function() {
            $('#nav').attr('class', '').html($('<div class="final">Your final score is: <em>' + app.quiz.score + ' / ' + app.questions + '</em></div>'))
                     .append($('<img src="try-again.png" style="border:0px; cursor: pointer;" />').click(app.quiz.reset))
                     .append($('<div class="share"></div>'));
            $('.share').html('<a href="https://twitter.com/intent/tweet?text=I was able to guess ' + app.quiz.score + ' / ' + app.questions + ' old photos in the Histagram quiz. Can you do better?&url=http://hista.gr" class="twitter" target="_blank">post to twitter</a>')
                       .append($('<a href="https://www.facebook.com/sharer/sharer.php?u=hista.gr" class="fb" target="_blank">post to facebook</a>'))
        },
        round: {
            photos: {},
            answer: null,

            init: function() {
                var content = $('<span class="introquestion">What did this place look like before?</span><span class="score">Your score:<br />' + app.quiz.score + ' / ' + (app.quiz.position -1) + '</span>');
                $("#nav").animate({height:'400', width:'400'}, function() { $(".pic").fadeIn(); }).html(content).attr('class','');

                app.quiz.round.photos = {};
                app.quiz.round.roll()
                              .pickPhotos()
                              .displayPhotos();
            },
            pickPhotos: function() {
                var addresses = [];

                do {
                    var rand = Math.max(1,Math.round(Math.random() * app.data.get().length) -1);

                    if (typeof app.quiz.round.photos[rand] != 'undefined') continue; // Make sure a picture is only picked once

                    var photo = app.data.get(rand);

                    if (typeof photo['abm_address'] == "undefined") continue;
                    if (typeof photo['delving_thumbnail'] == "undefined") continue;
                    if (typeof photo['abm_latLong'] == "undefined") continue;
                    if (typeof photo['europeana_isShownBy'] == "undefined") continue;
                    if ($.inArray(photo['abm_address'][0], addresses) !== -1) continue;
                    if (photo['abm_address'][0].match(/([0-9]+)/) == null) continue;

                    addresses.push(photo['abm_address'][0]);

                    app.quiz.round.photos[rand] = {
                        latlong: 		photo['abm_latLong'][0],
                        title:   		photo['dc_title'][0],
                        url:     		photo['delving_thumbnail'][0],
                        url2:    		photo['europeana_isShownBy'][0],
						description: 	photo['delving_description'][0]
                    };
                } while (Object.keys(app.quiz.round.photos).length < 3);

                return app.quiz.round;
            },
            displayPhotos: function() {
                var n = 0;
                $.each(app.quiz.round.photos, function(i,photo) {
                    $('#p' + ++n).html(
                        $('<img>', {'src': photo.url, 'width':400,'height':400})
                    ).append($('<div class="hover"></div>'));
                });

                var latlong = app.quiz.round.photos[Object.keys(app.quiz.round.photos)[app.quiz.round.answer]].latlong.split(',')
                var options = {
                    position: new google.maps.LatLng(latlong[0],latlong[1]),
                    pov: {heading: 165,pitch: 0},
                    zoom: 1,
					scrollwheel: false
                };
                var myPano = new google.maps.StreetViewPanorama(document.getElementById('map-canvas'), options);
                myPano.setVisible(true);

                return app.quiz.round;
            },
            roll: function() {
                app.quiz.round.answer = Math.floor(Math.random() * 3);

                return app.quiz.round;
            },
            checkAnswer: function() {
                $("#nav").animate({height:'800', width:'825'});
                $(".pic").hide();

                var answer = app.quiz.round.photos[Object.keys(app.quiz.round.photos)[app.quiz.round.answer]];

                if (app.quiz.round.answer == $(this).attr('id').replace('p','')-1) {
                    app.quiz.addScore();
                    $("#nav").attr('class','correct').html($('<strong>✓</strong>'));
                } else {
                    $("#nav").attr('class','wrong').html($('<strong>x</strong><span>The correct answer was:</span>'));
                }
                $("#nav").append($('<div class="polaroid"></div>').append($('<img>', {'src': answer.url, 'width':400,'height':400})).append($('<p></p>').text(answer.title))).append($('<p></p>').text(answer.description));
                $('#c').html(app.quiz.score);
				
                if (app.quiz.position == app.questions) {
                    $("#nav").append($('<img src="continue.png" style="border:0px; cursor: pointer;" />').click(app.quiz.endscreen));
                } else {
                    $("#nav").append($('<img src="next-image.png" style="border:0px; cursor: pointer;" />').click(app.quiz.nextQuestion));
                }
            }
        }
    }
};
$(function() {app.init();});