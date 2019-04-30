const request = require('request');
const cheerio = require('cheerio');

module.exports = function(callback){
    request("https://www.naver.com", function (err, response, body) {
        let list = [];
        $ = cheerio.load(body);

        let top20 = $(".ah_roll_area > .ah_l > li > a > .ah_k");

        for (let i = 0; i < top20.length; i++) {
            let msg = $(top20[i]).text();
            list.push(msg);
        }

        callback(list);
    });
};