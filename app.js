
/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path');

var MongoStore=require('connect-mongo')(express)
    ,settings=require('./settings')
    ,flash=require('connect-flash');

var app = express();

app.engine('html',require('ejs').renderFile);//为了在ejs中能使用.html

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');

    app.use(flash());

    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser({uploadDir:'./uploads',keepExtensions:true}));
    app.use(express.methodOverride());

    app.use(express.cookieParser());
    app.use(express.session({
        secret:settings.cookieSecret,
        store:new MongoStore({
            db:settings.db
        })
    }));

    app.use(express.static(path.join(__dirname, 'public')));
    app.use(app.router);

});

app.configure('development', function(){
    app.use(express.errorHandler());
});

require('./routes')(app);

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
    console.log("服务器已经通过:"+app.get('port')+"端口启动...");
});
