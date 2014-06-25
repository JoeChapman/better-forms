'use strict';

var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    form = require('./form'),
    session = require('express-session'),
    app = express();

app.disable('x-powered-by');

app.locals.basedir = __dirname + '/views/';

app
    .set('env', process.env.NODE_ENV || 'development')
    .set('port', process.env.PORT || 3030)
    .set('name', 'Simple form')
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'jade')
    .use(session({secret: 'not safe'}))
    .use(bodyParser.urlencoded({extended: true}));

app
    .get('/', form.requestHandler)
    .post('/', form.requestHandler);

app.listen(app.get('port'), function () {
    console.log(app.get('name'), 'listening on port', app.get('port'));
});

