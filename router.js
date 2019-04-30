const express = require('express');
const qs = require('querystring');
const iconv = require('iconv-lite');
const charset = require('charset');
const mysql = require('mysql');
const request = require('request');
const cheerio = require('cheerio');

const dbinfo = require('./dbinfo');
const Top20 = require('./mymodules/Top20');
const Lunch = require('./mymodules/Lunch');
const datalab = require('./mymodules/NaverData');

const router = express.Router();

const conn = mysql.createConnection(dbinfo);

conn.query("USE yy_30209");

router.get('/', function (req, res) {
    res.render('main', { msg: 'Welcome To Express4' });
});

router.get('/top20', function (req, res) {
    Top20(function (list) {
        res.render('top', { msg: '네이버 실시간 급상승 검색어', list: list });
    });
});


router.get('/search', function (req, res) {
    res.render('search', {});
});

router.post('/search', function (req, res) {
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

router.get('/lunch', function (req, res) {
    res.render('lunch', {});
});

router.post('/lunch', function (req, res) {
    Lunch(req.body.date, function (menu) {
        res.render('lunch', { menu: menu.text() });
    });
});

router.get('/board', function (req, res) {
    let sql = "SELECT * FROM board WHERE title LIKE ? ORDER BY id DESC";
    let keyword = "%%";
    if (req.query.key != undefined) {
        keyword = "%" + req.query.key + "%";
    }

    conn.query(sql, [keyword], function (err, result) {

        res.render('board', { list: result });
    });
});

router.get('/board/write', function (req, res) {
    res.render('write', {});
});

router.post('/board/write', function (req, res) {
    let param = [req.body.title, req.body.content, req.body.writer];

    let sql = "INSERT INTO board (title, content, writer) VALUES(?, ?, ?)";
    conn.query(sql, param, function (err, result) {
        if (!err) {
            res.redirect('/board');
        };
    });
});

router.get('/exchange', function (req, res) {

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

router.get('/datalab', function (req, res) {
    res.render('datalab', {});
});

router.post("/datalab", function (req, res) {
    let data = [
        {
            "groupName": req.body.stitle,
            "keywords": req.body.skeywords.split(",")
        }
    ];

    datalab("2019-02-01", "2019-04-30", "week", data, function (result) {
        let colors = ["rgb(255,192,192)", "rgb(75,192,255)", "rgb(192,75,255)"];

        let gData = { "labels": [], "datasets": [] };

        let r = result.results;
        console.log(result);
        for (let i = 0; i < r.length; i++) {
            let item = {
                "label": r[i].title,
                "borderColor": colors[i],
                "fill": false,
                "lineTension": 0.2,
                "data": []
            };

            for (let j = 0; j < r[i].data.length; j++) {
                item.data.push(r[i].data[j].ratio);
                if (i == 0) {
                    let date = r[i].data[j].period;
                    let arr = date.split("-");
                    gData.labels.push(arr[1] + arr[2]);
                }
            }

            gData.datasets.push(item);
        }
        console.log(gData);

        res.render('datalab2', { g: gData });

    });
});

module.exports = router;