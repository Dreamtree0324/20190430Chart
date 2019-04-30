const express = require('express');
const http = require('http');
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');  //여기
const qs = require('querystring');
const iconv = require('iconv-lite');
const charset = require('charset');
const mysql = require('mysql');

/* mysql 연결 부분 */
const conn = mysql.createConnection({
    user: "yy_30209",
    password: "1234",
    host: "gondr.asuscomm.com"
});

conn.query("USE yy_30209");

let app = express();

app.set('port', 12000);

app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json()); //미들웨어로 바디파서를 사용함. //여기
app.use(bodyParser.urlencoded({ extended: true })); //여기

app.get('/', function (req, res) {
    res.render('main', { msg: 'Welcome To Express4' });
});

app.get('/top20', function (req, res) {

    request("https://www.naver.com", function (err, response, body) {
        let list = [];
        $ = cheerio.load(body);

        let top20 = $(".ah_roll_area > .ah_l > li > a > .ah_k");

        for (let i = 0; i < top20.length; i++) {
            let msg = $(top20[i]).text();
            list.push(msg);
        }

        res.render('top', { msg: '네이버 실시간 급상승 검색어', list: list });
    });
});


app.get('/search', function (req, res) {
    res.render('search', {});
});

app.post('/search', function (req, res) {
    let word = req.body.word;
    word = qs.escape(word);
    let url = "https://search.naver.com/search.naver?sm=top_hty&fbm=1&ie=utf8&query=" + word;
    request(url, function (err, response, body) {
        let list = [];
        $ = cheerio.load(body);

        let result = $(".sp_website .type01 > li dt > a:first-child");

        for (let i = 0; i < result.length; i++) {
            let msg = $(result[i]).text();
            list.push(msg);
        }

        res.render('search', { msg: '검색 결과', list: list });
    });
});

app.get('/lunch', function (req, res) {
    res.render('lunch', {});
});

app.post('/lunch', function (req, res) {
    let date = req.body.date;
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

        res.render('lunch', { menu: menu.text() });
    });
});

app.get('/board', function (req, res) {
    let sql = "SELECT * FROM board WHERE title LIKE ? ORDER BY id DESC";
    let keyword = "%%";
    if (req.query.key != undefined) {
        keyword = "%" + req.query.key + "%";
    }

    conn.query(sql, [keyword], function (err, result) {

        res.render('board', { list: result });
    });
});

app.get('/board/write', function (req, res) {
    res.render('write', {});
});

app.post('/board/write', function (req, res) {
    let param = [req.body.title, req.body.content, req.body.writer];

    let sql = "INSERT INTO board (title, content, writer) VALUES(?, ?, ?)";
    conn.query(sql, param, function (err, result) {
        if (!err) {
            res.redirect('/board');
        };
    });
});

app.get('/exchange', function (req, res) {

    request("https://search.naver.com/search.naver?sm=top_hty&fbm=1&ie=utf8&query=%EB%84%A4%EC%9D%B4%EB%B2%84+%ED%99%98%EC%9C%A8", function (err, response, body) {
        $ = cheerio.load(body);

        let upSellList = [];
        let dwSellList = [];
        let upCountryList = [];
        let dwCountryList = [];

        let upSell = $("tbody > tr.up > td:nth-child(2) > span");
        let dwSell = $("tbody > tr.dw > td:nth-child(2) > span");
        let upCountry = $("tbody > tr.up > th > a > span");
        let dwCountry = $("tbody > tr.dw > th > a > span");

        let time = $(".grp_info em");

        let result = [upSellList, dwSellList, upCountryList, dwCountryList, time];

        let timemsg = time.text();

            for (let i = 0; i < upSell.length; i++) {
                let msgUpSell = $(upSell[i]).text();
                msgUpSell = msgUpSell.split(",").join("");
                upSellList.push(msgUpSell);

                let msgUpCountry = $(upCountry[i]).text();
                upCountryList.push(msgUpCountry);

                let param = [msgUpSell, msgUpCountry, timemsg];

                let sql = "INSERT INTO exchange (msgUpSell, msgUpCountry, timemsg) VALUES(?,?,?)";
                conn.query(sql, param, function (err, result) { });
                }

            for (let i = 0; i < dwSell.length; i++) {
                let msgDwSell = $(dwSell[i]).text();
                msgDwSell = msgDwSell.split(",").join("");
                dwSellList.push(msgDwSell);

                let msgDwCountry = $(dwCountry[i]).text();
                dwCountryList.push(msgDwCountry);

                let param = [msgDwSell, msgDwCountry, timemsg];

                let sql = "INSERT INTO exchange (msgDwSell, msgDwCountry, timemsg) VALUES(?,?,?)";
                conn.query(sql, param, function (err, result) { });
            }
            
            res.render('exchange', { msg: '현재 환율', result: result });
        });
    });
let server = http.createServer(app);
server.listen(app.get('port'), function () {
    console.log(`Express 엔진이 ${app.get('port')}에서 실행중`);
});
