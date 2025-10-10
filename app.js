require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
    // Log the technical error for debugging
    console.error(err);

    // Check for specific, user-friendly Notion API errors first
    if (err.code === 'object_not_found' || err.status === 404) {
        return res.status(404).render('index', {
            title: 'Notion Documentation Generator',
            error: 'The provided Page ID was not found. Please ensure it is correct and that your Notion integration has been shared with that page.'
        });
    } else if (err.code === 'unauthorized' || err.status === 401) {
        return res.status(401).render('index', {
            title: 'Notion Documentation Generator',
            error: 'The Notion API Key is invalid or has not been provided. Please check your .env file.'
        });
    }

    // For all other errors, use the generic error page
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Render the generic error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;