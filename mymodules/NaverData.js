const request = require('request');

const apikey = require('./apikeys');

module.exports = function (start, end, unit, data, callback) {
    let apiURL = "https://openapi.naver.com/v1/datalab/search";

    let req_body = {
        "startDate": start,
        "endDate": end,
        "timeUnit": unit,
        "keywordGroups":data
    }

    request.post({
        url: apiURL,
        body: JSON.stringify(req_body),
        headers: {
            'X-Naver-Client-Id': apikey.CLIENT_ID,
            'X-Naver-Client-Secret': apikey.CLIENT_SECRET,
            'Content-Type': 'application/json'
        }
    },
        function (err, response, body) {
            callback(JSON.parse(body));
        });
}

