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

const onSave = (req, res) => {
	console.log(JSON.stringify(req.body));
	// const obj = JSON.parse(JSON.stringify(req.body));
	if (req.files) {
		// const file = obj.file;
		console.log(JSON.parse(JSON.stringify(req.files)));
		const posterImage = req.files.posterImage;
		const posterImageName = posterImage.name;
		posterImage.mv(`${__dirname}/store/${posterImageName}`, (err) => {
			if (err) {
				console.log(err);
				res.send('There is error');
			} else {
				const backdropImage = req.files.backdropImage;
				const backdropImageName = backdropImage.name;
				backdropImage.mv(`${__dirname}/store/${backdropImageName}`, (err) => {
					if (err) {
						console.log(err);
						res.send('There is error');
					} else {
						res.send('uploaded successfully');
					}
				});
			}
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
			console.log('response sent');
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
