// Copyright (c) 2013-2015 Jules Coynel
// https://github.com/jcoynel/app-store-reviews

var EventEmitter = require('events').EventEmitter;
var Util = require('util');
var request = require('request');
var parseString = require('xml2js').parseString;

module.exports = AppStoreReviews;
Util.inherits(AppStoreReviews, EventEmitter);
function AppStoreReviews() {
    EventEmitter.call(this);
}

AppStoreReviews.prototype.getReviews = function (app, country, page) {
	var self = this;
	var url = 'http://itunes.apple.com/rss/customerreviews/page=' + page + '/id=' + app + '/sortby=mostrecent/xml?cc=' + country;

	request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
			var data;// = JSON.parse(body);		
      parseString(body, function (err, result) {
        data = result;
      });
			var entry = data['feed']['entry'];
			var links = data['feed']['link'];
			
			if (entry && links) {
				for (var i = 0; i < entry.length ;i++) {
          var rawReview = entry[i];
					if ('author' in rawReview) {	
						try
            {		
							var comment = {};
							comment['id'] = rawReview['id'][0];
							comment['app'] = app;
							comment['author'] = rawReview['author'][0]['name'][0];
							comment['version'] = rawReview['im:version'][0];
							comment['rate'] = rawReview['im:rating'][0];
							comment['title'] = rawReview['title'][0];
              comment['comment'] = rawReview['content'][0]["_"];
              comment['vote'] = rawReview['im:voteCount'][0];
              if (rawReview['updated'] && rawReview['updated'][0]) {
                comment['updated'] = rawReview['updated'][0];
              } else {
                comment['updated'] = '';
                console.log( rawReview );
                exit(-1);
              } 
							comment['country'] = country;
							
							self.emit('review', comment);
                       }
                       catch (err) 
                       {
                         console.log(err);
                       }
					}
				}
				
				/*
				Because there are only 50 reviews per page, we need to find out if there is a next page.
				If so, we emit a 'nextPage' event.
				*/
				for (var i = 0; i < links&&links[0].length; i++) {
					var link = links[0][i]['attributes'];
					var rel = link['rel'];
					var href = link['href'];
					
					// Find the last page number
					if (rel == 'last') {
						var urlSplit = href.split('/');
						for (var index = 0; index < urlSplit.length; index++) {
							var currentUrlPart = urlSplit[index];
							if (currentUrlPart.substring(0, 5) == 'page=') {
								var lastPage = currentUrlPart.replace('page=', '');
								if (page < lastPage) {
									self.emit('nextPage', {'appId': app, 'country': country, 'currentPage': page, 'nextPage': page + 1});
                }
							}
						}
					}
				}
			} else {
				self.emit('empty', data['feed']['id']['label']);
			}
		}
	});
}

AppStoreReviews.prototype.allCountries = function () {
	// Based on http://developer.apple.com/library/ios/#documentation/LanguagesUtilities/Conceptual/iTunesConnect_Guide/C_AppStoreTerritories/AppStoreTerritories.html
	// Updated on 23 April 2013
	return ['ae', 'ag', 'ai', 'al', 'am', 'ao', 'ar', 'at', 'au', 'az', 'bb', 'be', 'bf', 'bg', 'bh', 'bj', 'bm', 'bn', 'bo', 'br', 'bs', 'bt', 'bw', 'by', 'bz', 'ca', 'cg', 'ch', 'cl', 'cn', 'co', 'cr', 'cv', 'cy', 'cz', 'de', 'dk', 'dm', 'do', 'dz', 'ec', 'ee', 'eg', 'es', 'fi', 'fj', 'fm', 'fr', 'gb', 'gd', 'gh', 'gm', 'gr', 'gt', 'gw', 'gy', 'hk', 'hn', 'hr', 'hu', 'id', 'ie', 'il', 'in', 'is', 'it', 'jm', 'jo', 'jp', 'ke', 'kg', 'kh', 'kn', 'kr', 'kw', 'ky', 'kz', 'la', 'lb', 'lc', 'lk', 'lr', 'lt', 'lu', 'lv', 'md', 'mg', 'mk', 'ml', 'mn', 'mo', 'mr', 'ms', 'mt', 'mu', 'mw', 'mx', 'my', 'mz', 'na', 'ne', 'ng', 'ni', 'nl', 'no', 'np', 'nz', 'om', 'pa', 'pe', 'pg', 'ph', 'pk', 'pl', 'pt', 'pw', 'py', 'qa', 'ro', 'ru', 'sa', 'sb', 'sc', 'se', 'sg', 'si', 'sk', 'sl', 'sn', 'sr', 'st', 'sv', 'sz', 'tc', 'td', 'th', 'tj', 'tm', 'tn', 'tr', 'tt', 'tw', 'tz', 'ua', 'ug', 'us', 'uy', 'uz', 'vc', 've', 'vg', 'vn', 'ye', 'za', 'zw'];
}
