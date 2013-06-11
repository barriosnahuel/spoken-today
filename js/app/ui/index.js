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

    var findNewsForQuery = function (query, container) {

        var googleFeedsCallback = function (result) {
            var index;
            var eachEntry;

            if (!result.error) {
                for (index = 0; index < result.entries.length; index++) {
                    eachEntry = result.entries[index];
                    var templateData = {title: eachEntry.title, contentSnippet: eachEntry.contentSnippet, link: eachEntry.link};
                    container.append($('#rssFeedTemplate').render(templateData));
                }
            }
        };

        var flickrCallback = function (data) {
            $.each(data.items, function (index, item) {

                var templateData = {title: item.title, contentSnippet: item.description, link: item.link};
                container.append($('#flickrNewsTemplate').render(templateData));

                //  TODO onmouseover cargo la .description con un popover de bootstrap.
                //  TODO Usar isotope para ubicar las imágenes de manera de aprovechar el espacio en el sitio.
            });
        };

        var twitterCallback = function (data) {
            if (!data.error) {
                $.each(data.results, function (index, eachItem) {
                    var templateData = {user: eachItem.from_user, text: eachItem.text, tweetId: eachItem.id};
                    container.append($('#twitterNewsTemplate').render(templateData));
                });
            }
        };

        var googlePlusCallback = function (data) {
            $.each(data.items, function (index, eachItem) {
                if (eachItem.title !== '') {
                    container.append('<li class="gplus">' + eachItem.title + '</li>');
                }
            });
        };

        var facebookCallback = function (data) {
            $.each(data.data, function (index, eachItem) {
                container.append('<li class="facebook">' + eachItem.message + '</li>');
            });
        };

        app.service.newsFinder.findNews(query, googleFeedsCallback, flickrCallback, twitterCallback, googlePlusCallback, facebookCallback);
    };

    /**
     * Scroll to the specified {@code jQuerySelector}.
     * @param jQuerySelector A jQuery selector to scroll the entire page.
     */
    var scrollTo = function (jQuerySelector) {
        $('html, body').stop().animate({
            scrollTop: $(jQuerySelector).offset().top
        }, 1500);
    };

    var createNewTopic = function (topicName, atBegin) {
        //  TODO : Use a template instead of this horrible script!
        //  TODO : Split this function into others two: createMenuEntry() and createSection()

        var trendNameElementId = topicName.replace(/ /g, '');
        var content = $('.content');

        var templateData = {trendNameElementId: trendNameElementId, topicName: topicName};
        var menuHTML = $('#menuItemTemplate').render(templateData);

        if (atBegin) {
            $('.nav').prepend(menuHTML);
        } else {
            $('.nav').append(menuHTML);
        }


        var trendNameElementSelector = '#' + trendNameElementId;
        $('.nav a[href=' + trendNameElementSelector + ']').on('click', function () {
            scrollTo(trendNameElementSelector);
        });

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
        var sectionIdSelector = createNewTopic(userQuery, true);

        findNewsForQuery(userQuery, $(sectionIdSelector + ' ul'));
        scrollTo(sectionIdSelector);
    };

    var findNewsForTrends = function (index, eachItem) {
        var trendName = app.util.strings.getKeywordWithoutPreffix(eachItem.name);

        var eachSectionList = $(createNewTopic(trendName) + ' ul');

        $.each(eachItem.keywords, function (index, eachKeyword) {
            findNewsForQuery(eachKeyword, eachSectionList);
        });
    };

    //    ********************************************
    //    Bind events and customize controls behavior.

    var customSearchButton = $('#customSearchButton');

    customSearchButton.on('click', findNewsForCustomTopic);

    $('form').submit(function (event) {
        event.preventDefault();
        customSearchButton.click();
    });

    $('#navbar').affix();


    //    ************************************************
    //    Load trends, then news for those trending topics

    app.service.instagram.findTrends(function (data) {
        var instagramDiv = $('#instagramPopularPhotos');
        var index;

        for (index = 0; index < data.data.length; index++) {
            var templateData = {link: data.data[index].link, thumbnail: data.data[index].images.thumbnail.url};
            instagramDiv.append($('#instagramNewsTemplate').render(templateData));
        }
    });


    $.when(app.service.google.search.findTrends()).done(function (result) {
        var index, eachTrend, trends = [];

        var googleTrends = result.feed.entries;
        for (index = 0; index < googleTrends.length; index++) {
            eachTrend = googleTrends[index];
            trends[index] = {name: eachTrend.title, keywords: eachTrend.content.split(', ')};
        }

        $.each(trends, findNewsForTrends);
    });

    $.when(app.service.twitter.findTrends()).done(function (data) {
        var index, eachTrend, trends = [];

        var twitterTrends = data[0].trends;
        for (index = 0; index < twitterTrends.length; index++) {
            eachTrend = twitterTrends[index];
            trends[index] = {name: eachTrend.name, keywords: [eachTrend.name]};
        }

        $.each(trends, findNewsForTrends);
    });

});