/*
 * Epic Moments - What people all around the world are saying when you want to hear them.
 * Copyright (C) 2013 Nahuel Barrios <barrios.nahuel@gmail.com>.
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Created by Nahuel Barrios <barrios.nahuel@gmail.com>.
 * Created on 6/5/13, at 12:56 AM.
 */

$(document).ready(function () {
    'use strict';

    var GLOBAL_TRENDS_LIST_ID = '#globalTrends';
    var trends = [], nextTrendToLoad;

    var findNewsForQuery = function (query, container) {

        var googleFeedsCallback = function (result) {
            var index, eachEntry, templateData;

            if (!result.error) {
                for (index = 0; index < result.entries.length; index++) {
                    eachEntry = result.entries[index];
                    templateData = {title: eachEntry.title, contentSnippet: eachEntry.contentSnippet, link: eachEntry.link};
                    container.append($('#rssFeedTemplate').render(templateData));
                }
            }
        };

        var twitterCallback = function (data) {
            if (!data.error) {
                $.each(data.results, function (index, eachItem) {
                    var templateData = {userName: eachItem.from_user, text: eachItem.text, id: eachItem.id_str};
                    container.append($('#twitterNewsTemplate').render(templateData));
                });
            }
        };

        var facebookCallback = function (data) {
            $.each(data.data, function (index, eachItem) {
                var templateData = {userId: eachItem.from.id, userName: eachItem.from.name, text: app.util.strings.truncate(eachItem.message), id: eachItem.id};
                container.append($('#facebookNewsTemplate').render(templateData));
            });
        };

        var googlePlusCallback = function (data) {
            $.each(data.items, function (index, eachItem) {
                if (eachItem.title !== '') {
                    var templateData = {userId: eachItem.actor.id, userName: eachItem.actor.displayName, text: app.util.strings.truncate(eachItem.title), link: eachItem.object.url};
                    container.append($('#googlePlusNewsTemplate').render(templateData));
                }
            });
        };

        var flickrCallback = function (data) {
            var templateData = {}, index, eachItem, imagesContainer, li;

            templateData.photos = [];

            for (index = 0; index < data.items.length; index++) {
                eachItem = data.items[index];
                templateData.photos[index] = {photo: eachItem.media.m, link: eachItem.link};
            }

            li = container.find('li[class=flickr]');

            if (li.length === 0) {
                li = container.append('<li class="flickr"></li>').find('li[class=flickr]');
            }

            li.append($('#flickrNewsTemplate').render(templateData));

            imagesContainer = li.find('div');
            imagesContainer.imagesLoaded(function () {
                imagesContainer.isotope({itemSelector: '.isotopeTest', animationEngine: 'best-available'});
            });
        };

        var instagramCallback = function (data) {
            var templateData = {}, index, eachItem, imagesContainer, li;

            templateData.photos = [];

            if (data.meta.code === 200) {
                for (index = 0; index < data.data.length; index++) {
                    eachItem = data.data[index];

                    templateData.photos[index] = {photo: eachItem.images.thumbnail.url, link: eachItem.link};
                }

                li = container.find('li[class=flickr]');

                if (li.length === 0) {
                    li = container.append('<li class="flickr"></li>').find('li[class=flickr]');
                }

                li.append($('#flickrNewsTemplate').render(templateData));

                imagesContainer = li.find('div');
                imagesContainer.imagesLoaded(function () {
                    imagesContainer.isotope({itemSelector: '.isotopeTest', animationEngine: 'best-available'});
                });
            } else {
                console.log('Ocurrió un error al recuperar las noticias de Instagram: ' + data.meta.code);
                //  TODO : Send this error to Google Analytics
            }
        };

        app.service.newsFinder.findNews(query, googleFeedsCallback, flickrCallback, twitterCallback, googlePlusCallback, facebookCallback, instagramCallback);
    };

    /**
     * Scroll to the specified {@code jQuerySelector}.
     * @param jQuerySelector A jQuery selector to scroll the entire page.
     */
    var scrollTo = function (jQuerySelector) {
        $('html, body').stop().animate({
            scrollTop: $(jQuerySelector).offset().top - 100
        }, 1500);
    };


    var createMenuEntry = function (containerQuerySelector, topicName) {
        var trendNameElementId = topicName.replace(/ /g, '').replace(/\./g, '');

        var templateData = {trendNameElementId: trendNameElementId, topicName: topicName};
        var menuHTML = $('#menuItemTemplate').render(templateData);

        $(containerQuerySelector).append(menuHTML);

        return templateData;
    };


    var createNewSection = function (containerQuerySelector, templateData, atBegin) {

        var trendNameElementSelector = '#' + templateData.trendNameElementId;
        $(containerQuerySelector + ' a[href=' + trendNameElementSelector + ']').on('click', function () {
            scrollTo(trendNameElementSelector);
        });

        var content = $('.content');

        var sectionHTML = $('#newsSectionTemplate').render(templateData);
        if (atBegin) {
            content.prepend(sectionHTML);
        } else {
            content.append(sectionHTML);
        }

        return trendNameElementSelector;
    };

    /**
     * Find news from all configured sources for a specific topic that has been choosed for the user in the search box of the left side menu.
     */
    var findNewsForCustomTopic = function () {
        var userQuery = $('form input').val();

        var containerQuerySelector = '#queries';
        var templateData = createMenuEntry(containerQuerySelector, userQuery);

        var sectionIdSelector = createNewSection(containerQuerySelector, templateData, true);

        findNewsForQuery(userQuery, $(sectionIdSelector + ' ul'));
        scrollTo(sectionIdSelector);
    };

    var findNewsForTrends = function (eachItem) {
        var trendName = app.util.strings.getKeywordWithoutPreffix(eachItem.name);

        var trendNameElementId = trendName.replace(/ /g, '').replace(/\./g, '');
        var templateData = {trendNameElementId: trendNameElementId, topicName: trendName};

        var eachSectionList = $(createNewSection(GLOBAL_TRENDS_LIST_ID, templateData) + ' ul');

        findNewsForQuery(eachItem.keywords, eachSectionList);

        if (nextTrendToLoad == undefined) {
            nextTrendToLoad = 1;
        } else {
            nextTrendToLoad = nextTrendToLoad + 1;
        }
    };

    //    ********************************************
    //    Bind events and customize controls behavior.

    function loadNews(jQueryElementWithWaypoint) {
        findNewsForTrends(trends[nextTrendToLoad]);

        if (nextTrendToLoad < trends.length) {
            //  Waits 5 seconds till call to destroy-->create the waypoint because if not then loads all topics before append the second one.
            setTimeout(addWaypoint, 4000);
        } else {
            jQueryElementWithWaypoint.waypoint('destroy');
        }
    }

    var addWaypoint = function (containerSelector) {
        var container = $(containerSelector);
        container.waypoint('destroy');
        container.waypoint(loadNewsOnScroll, { offset: '125%' });

        function loadNewsOnScroll(direction) {
            if ('down' === direction && nextTrendToLoad) {
                loadNews(container);
            }
        }
    };

    addWaypoint('footer');

    $('form').submit(function (event) {
        event.preventDefault();
        findNewsForCustomTopic();
    });

    //    ************************************************
    //    Load trends, then news for those trending topics

    app.service.socialNetworks.instagram.findTrends(function (data) {
        var instagramDiv = $('#instagramPopularPhotos');
        var index;

        for (index = 0; index < data.data.length; index++) {
            var templateData = {link: data.data[index].link, thumbnail: data.data[index].images.thumbnail.url};
            instagramDiv.append($('#instagramNewsTemplate').render(templateData));
        }

        //  TODO : Retrieve tags from theese photos, add them to trends and search for photos with those tags!
    });

    $.when(app.service.google.search.findTrends()).done(function (result) {
        var index, eachTrend;

        var googleTrends = result.feed.entries;
        for (index = 0; index < googleTrends.length; index++) {
            eachTrend = googleTrends[index];

            var keywords = [];
            if (eachTrend.content !== '') {
                keywords = eachTrend.content.split(', ');
            } else {
                keywords[0] = eachTrend.title;
            }

            trends[index] = {name: eachTrend.title, keywords: keywords};
        }

        for (index = 0; index < trends.length; index++) {
            createMenuEntry(GLOBAL_TRENDS_LIST_ID, trends[index].name);
        }

        findNewsForTrends(trends[0]);
    });

    //    $.when(app.service.socialNetworks.twitter.findTrends()).done(function (data) {
    //        var index, eachTrend, trends = [];
    //
    //        var twitterTrends = data[0].trends;
    //        for (index = 0; index < twitterTrends.length; index++) {
    //            eachTrend = twitterTrends[index];
    //            trends[index] = {name: eachTrend.name, keywords: [eachTrend.name]};
    //        }
    //
    //        $.each(trends, findNewsForTrends);
    //    });

});