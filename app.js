const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path'); //used for file path
const { nanoid } = require('nanoid');
const fileUpload = require('express-fileupload');
const app = express();
// app.set('view engine', 'ejs');

app.use(express.static(__dirname));
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
const TMDBTrending = require('./models/tmdbTrending');

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

app.post('/onSaveTrending', function(req, res) {
	console.log('onSaveTrending');
	onSaveTrending(req, res);
});

app.post('/searchMovie', function(req, res) {
	console.log('searchMovie');
	searchMovieByTitle(req, res);
});

app.post('/getTrendingMovie', function(req, res) {
	console.log('getTrendingMovie');
	getTrendingMovie(req, res);
});

const getTrendingMovie = (req, res) => {
	const obj = JSON.parse(JSON.stringify(req.body));
	TMDBTrending.find()
		.then((result) => {
			console.log(result);
			res.send(JSON.stringify(result));
			res.end();
			return;
		})
		.catch((err) => {
			console.error(`getTrendingMovie# Failed to fetch documents : ${err}`);
			res.send(JSON.stringify(null));
			res.end();
			return;
		});
};

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

const onSaveTrending = (req, res) => {
	// console.log(JSON.stringify(req.body));
	const obj = JSON.parse(JSON.stringify(req.body));
	const movieData = obj.movie_data;
	const dataFor = obj.data_for;
	const fsId = nanoid();

	// check if this movie exist in movie document.
	Movie.find({ title: movieData.title, release_date: Number(movieData.release_date) }).then((result) => {
		console.log('result1: ', result);
		if (result.length > 0) {
			// means exist in movie, so update only home data
			delete movieData['_id'];
			// console.log(result);
			HomeData.collection
				.updateOne(
					{ title: movieData.title, release_date: Number(movieData.release_date) },
					{
						$set: {
							...movieData,
							...{ data_for: dataFor },
							...{ create_date_time: new Date(Date.now()) }
						}
					},
					{ upsert: true }
				)
				.then((result2) => {
					console.log('success');
					res.send('success');
					res.end();
					return;
				})
				.catch((err) => {
					console.error(`onSaveTrending# Failed to update new documents : ${err}`);
					res.send('fail');
					res.end();
					return;
				});
		} else {
			// insert into movie and homedata as well

			movieData['fs_id'] = fsId;
			// movieData['data_for'] = movie.save_as;
			const insertMovieData = Movie.collection.insertOne(movieData);
			const insertHomeData = HomeData.collection.insertOne({ ...movieData, ...{ data_for: dataFor } });
			Promise.all([ insertMovieData, insertHomeData ])
				.then(([ result1, result2 ]) => {
					res.send(JSON.stringify('success'));
					res.end();
					return;
				})
				.catch((err) => {
					console.error(`onSaveTrending# Failed to insert new documents : ${err}`);
					res.send('fail');
					res.end();
					return;
				});
		}
	});
};

const onSave = (req, res) => {
	// console.log(JSON.stringify(req.body));
	const obj = JSON.parse(JSON.stringify(req.body));
	const movieDict = obj.movie_data;
	const movieExistFlag = obj.movie_exist_flag;
	const fsId = nanoid();
	console.log('movieExistFlag', movieExistFlag);
	var movieData;
	var movie;
	if (movieExistFlag === true) {
		movieData = movieDict;
		// movieData['create_date_time'] = new Date(Date.now());
	} else {
		var posterImagePath = null;
		var backdropImagePath = null;
		if (req.files) {
			console.log('files');
			const posterImage = req.files.posterImage;
			const posterImageName = fsId + '.jpg';
			const posterImageAbsPath = `${__dirname}/image/poster/${posterImageName}`;
			posterImagePath = `/image/poster/${posterImageName}`;
			const savePosterImage = posterImage.mv(posterImageAbsPath);

			const backdropImage = req.files.backdropImage;
			const backdropImageName = fsId + '.jpg';
			const backdropImageAbsPath = `${__dirname}/image/backdrop/${backdropImageName}`;
			backdropImagePath = `/image/backdrop/${backdropImageName}`;
			const saveBackdropImage = backdropImage.mv(backdropImageAbsPath);
			console.log('posterImagePath: ', posterImagePath);
			console.log('backdropImagePath: ', backdropImagePath);

			// http://192.168.0.100:3050/poster/cV5ihZgJNZJ_aOgIQGv9C.jpg
		}
		movie = JSON.parse(obj.movie);
		const OttProvider = movie.ott_channel;
		console.log('movie: ', movie);
		const streamInfo = {
			[OttProvider]: { in: { link: movie.ott_url } }
		};
		movieData = {
			// fs_id: nanoid(),
			tmdb_id: movie.tmdb_id,
			tmdb_rating: Number(movie.tmdb_rating),
			tmdb_vote_count: movie.tmdb_vote_count,
			age: Number(movie.age),
			adult: movie.adult === 'True' ? true : false,
			backdrop_path: backdropImagePath,
			backdrop_urls: {},
			belongs_to_collection: null,
			budget: null,
			genres: movie.genres,
			homepage: null,
			imdb_id: movie.imdb_id,
			imdb_rating: Number(movie.imdb_rating),
			imdb_vote_count: movie.imdb_vote_count,
			rotten_tomatoes_rating: Number(movie.rotten_tomatoes_rating),
			streaming_info: streamInfo,
			original_language: null,
			original_title: null,
			overview: movie.overview,
			poster_path: posterImagePath,
			poster_urls: {},
			cast: [],
			release_date: Number(movie.release_date),
			revenue: null,
			runtime: movie.runtime,
			spoken_languages: [],
			status: null,
			tagline: null,
			title: movie.title,
			trailer: movie.trailer,
			category: null, // like rom-com, sitcom etc
			media_type: movie.media,
			fs_rating: {},
			create_date_time: new Date(Date.now()),
			ratings: []
			// data_for: movie.save_as
		};
	}

	// check if this movie exist in movie document.
	Movie.find({ title: movieData.title, release_date: Number(movieData.release_date) }).then((result) => {
		console.log('result1: ', result);
		if (result.length > 0) {
			// means exist in movie, so update only home data
			delete movieData['_id'];
			console.log(result);
			HomeData.collection
				.updateOne(
					{ title: movieData.title, release_date: Number(movieData.release_date) },
					{
						$set: {
							...movieData,
							...{ data_for: movieDict.save_as }
						}
					},
					{ upsert: true }
				)
				.then((result2) => {
					console.log('success');
					res.send('success');
					res.end();
					return;
				})
				.catch((err) => {
					console.error(`onSave# Failed to update new documents : ${err}`);
					res.send('fail');
					res.end();
					return;
				});
		} else {
			// insert into movie and homedata as well

			movieData['fs_id'] = fsId;
			// movieData['data_for'] = movie.save_as;
			const insertMovieData = Movie.collection.insertOne(movieData);
			const insertHomeData = HomeData.collection.insertOne({ ...movieData, ...{ data_for: movie.data_for } });
			Promise.all([ insertMovieData, insertHomeData ])
				.then(([ result1, result2 ]) => {
					res.send(JSON.stringify('success'));
					res.end();
					return;
				})
				.catch((err) => {
					console.error(`onSave# Failed to insert new documents : ${err}`);
					res.send('fail');
					res.end();
					return;
				});
		}
	});
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

const onSaveX = (req, res) => {
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
			// fs_id: nanoid(),
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
			ratings: [],
			create_date_time: new Date(Date.now())
		};

		// check if data exist in homeData
		HomeData.collection.find({ title: movie.title, release_date: Number(movie.release_year) }).then((result) => {
			if (result) {
				// means data exist in movie and homeData so just update it in home data
				const updateHomeData = HomeData.collection.updateOne(
					{ title: movie.title, release_date: Number(movie.release_year) },
					{
						$set: {
							movieData
						}
					}
				);

				const updateMovieData = Movie.collection.insertOne({ ...{ fs_id: nanoid() }, ...movieData });
				Promise.allSettled([ savePosterImage, saveBackdropImage, insertHomeData, insertMovieData ]);
			} else {
				// insert into movie and homeData

				const insertHomeData = HomeData.collection.insertOne({
					...{ fs_id: nanoid() },
					...movieData,
					...{ data_for: movie.save_as }
				});
				const insertMovieData = Movie.collection.insertOne({ ...{ fs_id: nanoid() }, ...movieData });
				Promise.allSettled([ savePosterImage, saveBackdropImage, insertHomeData, insertMovieData ]);
			}
		});

		// console.log('save_as', movie.save_as);
		// if (movie.save_as === 'trendingToday') {
		// 	console.log('1');
		// 	insertData = Trending.collection.insertOne(movieData);
		// } else if (movie.save_as === 'popularThisWeek') {
		// 	console.log('2');
		// 	insertData = TrendingThisWeek.collection.insertOne(movieData);
		// }

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
