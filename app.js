const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
// Data sanitization againist NoSQL query injection
app.use(mongoSanitize());
// Data sanitization againist XSS
app.use(xss());
// Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingQuantity',
      'price',
      'difficulty',
      'ratingAverage',
      'maxGroupSize',
    ],
  })
);

app.use(compression());
// app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  // console.log(Date());
  req.requestTime = new Date().toISOString();
  // console.log(req.requestTime);
  // console.log(req.cookies);

  next();
});

/*
app.get('/', (req, res) => {
  res.status(200).send('Hello form the server');
});

app.post('/', (req, res) => {
  res.send('You can post to this endpoint...');
});


*/

// 2) ROUTE HANDLERS

/*
app.get('/api/v1/tours', GetAllTours);
app.post('/api/v1/tours', CreateTour);
app.get('/api/v1/tours/:id', GetTour);
app.patch('/api/v1/tours/:id', UpdateTour);
app.delete('/api/v1/tours/:id', DeleteTour);

*/

// 3) ROUTES
// app.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker',
//     user: 'Ellon',
//   });
// });

// app.get('/overview', (req, res) => {
//   res.status(200).render('overview', {
//     title: 'All Tours',
//   });
// });

// app.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forest Hiker Tour',
//   });
// });
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `can't find ${req.originalUrl} on this server`
  // });

  // const err = new Error(`can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

// START SERVER

module.exports = app;
