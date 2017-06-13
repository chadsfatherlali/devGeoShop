'use strict';

var loopback = require('loopback'),
    boot = require('loopback-boot'),
    app = module.exports = loopback(),
    cookieParser = require('cookie-parser'),
    session = require('express-session');

/**
 * Passport Conf
 */

var loopbackPassport = require('loopback-component-passport'),
    PassportConfigurator = loopbackPassport.PassportConfigurator,
    passportConfigurator = new PassportConfigurator(app),
    bodyParser = require('body-parser'),
    flash = require('express-flash'),
    config = {};

try {
    config = require('../providers.json');
} 

catch (err) {
    console.trace(err);
    process.exit(1);
}


/**
 * Setup view engine
 */

var path = require('path');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/**
 * Monta la aplicacion con las rutas del API
 */
boot(app, __dirname, function(err) {
    if (err) throw err;
});

app.middleware('parse', bodyParser.json());
app.middleware('parse', bodyParser.urlencoded({
    extended: true,
}));

app.middleware('auth', loopback.token({
    model: app.models.accessToken,
}));

app.middleware('session:before', cookieParser(app.get('cookieSecret')));
app.middleware('session', session({
    secret: 'kitty',
    saveUninitialized: true,
    resave: true,
}));

passportConfigurator.init();

app.use(flash());

passportConfigurator.setupModels({
    userModel: app.models.user,
    userIdentityModel: app.models.userIdentity,
    userCredentialModel: app.models.userCredential,
});


for (var s in config) {
    var c = config[s];
    c.session = c.session !== false;
    passportConfigurator.configureProvider(s, c);
}

var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

/**
 * Rutas
 */

app.get('/', function(req, res, next) {
  res.render('pages/index', {
     user: req.user,
     url: req.url,
  });
});


/**
 * Arrancamos la app
 */

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

if (require.main === module) {
    app.start();
}
