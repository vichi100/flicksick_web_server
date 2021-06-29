const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tmdbTrendingSchema = new Schema({
	fs_id: String,
	tmdb_id: String,
	tmdb_rating: String,
	tmdb_vote_count: String,
	age: String,
	adult: Boolean,
	backdrop_path: String,
	backdrop_urls: {},
	belongs_to_collection: String,
	budget: String,
	genres: [],
	homepage: String,
	imdb_id: String,
	imdb_rating: Number,
	imdb_vote_count: String,
	rotten_tomatoes_rating: String,
	streaming_info: [],
	original_language: String,
	original_title: String,
	overview: String,
	poster_path: String,
	poster_urls: {},
	cast: [],
	release_date: Number,
	revenue: String,
	runtime: String,
	spoken_languages: [],
	status: String,
	tagline: String,
	title: String,
	trailer: String,
	category: String, // like rom-com, sitcom etc
	media_type: String,
	fs_rating: {}
});

module.exports = mongoose.model('tmdb_trending', tmdbTrendingSchema);
