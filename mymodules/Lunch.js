const request = require('request');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const charset = require('charset');

module.exports = function(date, callback){

    console.log(date);
    date = date.split("-").join("");

    const options = {
        url: 'http://www.y-y.hs.kr/lunch.view?date=' + date,
        headers: {
            'User-Agent': 'Mozilla/5.0',
        },
        encoding: null
    }

    request(options, function (err, response, body) {
        if (err != null) {
            console.log(err);
            return;
        }

        const enc = charset(response.headers, body);
        const result = iconv.decode(body, enc);

        $ = cheerio.load(result);
        let menu = $(".menuName > span");

        callback(menu);
    });
};