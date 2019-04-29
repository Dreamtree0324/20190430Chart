const request = require('request');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const charset = require('charset');

const options = {
    url: 'http://www.y-y.hs.kr/lunch.view?date=20190429',
    headers: {
        'User-Agent': 'Mozilla/5.0',
    },
    encoding:null
}
request(options, function (err, res, body) {
    if (err != null) {
        console.log(err);
        return;
    }

    const enc = charset(res.headers, body);
    console.log(enc);
    const result = iconv.decode(body, enc);
 
    $ = cheerio.load(result);
    let menu = $(".menuName > span");
    
    console.log(menu.text());
});