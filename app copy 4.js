const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path'); //used for file path
const { nanoid } = require('nanoid');
const fileUpload = require('express-fileupload');
const app = express();
// app.set('view engine', 'ejs');

app.use(fileUpload());
app.use(bodyParser.json());
app.use(function(req, res, next) {
	// res.header('Access-Control-Allow-Origin', '*');
	// // res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
	// // res.header(
	// //   //"Access-Control-Allow-Headers",
	// //   "Origin, X-Requested-With, Content-Type, Accept"
	// // );
	// res.header('Access-Control-Allow-Headers', 'Origin, X-Requested With, Content-Type, Accept');

	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization'
	);

	next();
});

const Util = require('./models/util');
const HomeData = require('./models/homeData');
const Movie = require('./models/movie');

const dbURL = 'mongodb+srv://vichi:vichi123@cluster0.emt5x.mongodb.net/flicksick_india?retryWrites=true&w=majority';
mongoose
	.connect(dbURL)
	.then(() => {
		// app.listen(6000 ,'0.0.0.0');
		app.listen(3050, '0.0.0.0', () => {
			console.log('server is listening on 3050 port');
		});

		console.log('MongoDB connected...server listening at 3050');
	})
	.catch((err) => console.log(err));

app.post('/getUtilData', function(req, res) {
	console.log('getUtilData');
	getUtilData(req, res);
});

app.post('/onSave', function(req, res) {
	console.log('onSave');
	onSave(req, res);
});

app.post('/searchMovie', function(req, res) {
	console.log('searchMovie');
	searchMovieByTitle(req, res);
});

const searchMovieByTitle = (req, res) => {
	const obj = JSON.parse(JSON.stringify(req.body));
	console.log(JSON.parse(JSON.stringify(req.body)));
	const title = obj.title;
	Movie.find({ title: { $regex: title, $options: 'i' } })
		.then((result) => {
			res.send(JSON.stringify(result));
			res.end();
			return;
		})
		.catch((err) => {
			console.error(`searchMovieByTitle # Failed to fetch data from Movies by name: ${err}`);
			res.send(JSON.stringify(null));
			res.end();
			return;
		});
	// db.users.find({"name": /m/})
};

const onSave = (req, res) => {
	console.log(JSON.stringify(req.body));
	const movieDict = JSON.parse(JSON.stringify(req.body));
	const movie = JSON.parse(movieDict.movie);
	if (req.files) {
		// const file = obj.file;
		console.log(JSON.parse(JSON.stringify(req.files)));
		// console.log(movieDict.movie);
		const posterImage = req.files.posterImage;
		const posterImageName = posterImage.name;
		const savePosterImage = posterImage.mv(`${__dirname}/store/${posterImageName}`);

		const backdropImage = req.files.backdropImage;
		const backdropImageName = backdropImage.name;
		const saveBackdropImage = backdropImage.mv(`${__dirname}/store/${backdropImageName}`);
		console.log('movie data: ', movie['title']);
		const movieData = {
			fs_id: nanoid(),
			tmdb_id: movie.tmdb_id,
			tmdb_rating: movie.tmdb_rating,
			tmdb_vote_count: movie.tmdb_vote_count,
			age: movie.age,
			adult: movie.adult === 'True' ? true : false,
			backdrop_path: null,
			backdrop_urls: {},
			belongs_to_collection: null,
			budget: null,
			genres: movie.genres,
			homepage: null,
			imdb_id: movie.imdb_id,
			imdb_rating: movie.imdb_rating,
			imdb_vote_count: movie.imdb_vote_count,
			rotten_tomatoes_rating: movie.rotten_tomatoes_rating,
			streaming_info: [],
			original_language: null,
			original_title: null,
			overview: movie.overview,
			poster_path: null,
			poster_urls: {},
			cast: [],
			release_date: Number(movie.release_year),
			revenue: null,
			runtime: movie.runtime,
			spoken_languages: [],
			status: null,
			tagline: null,
			title: movie.title,
			trailer: movie.trailer_url,
			category: null, // like rom-com, sitcom etc
			media_type: movie.media,
			fs_rating: {},
			create_date_time: new Date(Date.now())
		};

		let insertData;
		console.log('save_as', movie.save_as);
		if (movie.save_as === 'trendingToday') {
			console.log('1');
			insertData = Trending.collection.insertOne(movieData);
		} else if (movie.save_as === 'popularThisWeek') {
			console.log('2');
			insertData = TrendingThisWeek.collection.insertOne(movieData);
		}

		Promise.allSettled([ savePosterImage, saveBackdropImage, insertData ])
			.then(([ results1, result2, result3 ]) => {
				console.log(results1);
				console.log(result2);
				console.log(result3);
				res.send(JSON.stringify('success'));
				res.end();
				console.log('response sent');
				return;
			})
			.catch((err) => {
				res.send(JSON.stringify('fail'));
				res.end();
				console.log(err);
				return;
			});

		// const fileName = file.name;
	} else {
		console.log('There are no files');
	}
};

const getUtilData = (req, res) => {
	console.log(JSON.stringify(req.body));
	const obj = JSON.parse(JSON.stringify(req.body));
	Util.find({})
		.then((result) => {
			res.send(JSON.stringify(result));
			res.end();
			// console.log('response sent');
			return;
		})
		.catch((err) => {
			console.error(`getHomeScreenData# Failed to fetch documents : ${err}`);
			res.send(JSON.stringify('fail'));
			res.end();
			return;
		});
};

// // MONGODB- START
// const MongoClient = require('mongodb').MongoClient;
// const connectionString =
// 	'mongodb+srv://vichi:vichi123@cluster0.emt5x.mongodb.net/flicksick_india?retryWrites=true&w=majority';

// MongoClient.connect(connectionString, { useUnifiedTopology: true })
// 	.then((client) => {
// 		console.log('Connected to Database');
// 	})
// 	.catch((error) => console.error(error));

// app.post('/', (req, res) => {
// 	if (req.files) {
// 		const file = req.files.file;
// 		const fileName = file.name;
// 		file.mv(`${__dirname}/store/${fileName}`, (err) => {
// 			if (err) {
// 				console.log(err);
// 				res.send('There is error');
// 			} else {
// 				res.send('uploaded successfully');
// 			}
// 		});
// 	} else {
// 		res.send('There are no files');
// 	}
// });
// app.listen(5000, () => {
// 	console.log('server started');
// });

// access to XMLHttpRequest at has been blocked by CORS policy: Cannot parse Access - Control - Allow - Headers response header field in preflight response.
