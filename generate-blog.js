const axios = require('axios');
const fetch = require('node-fetch');

async function main() {
  const movieName = process.env.MOVIE_NAME || 'Oppenheimer';
  console.log(`🎥 Processing: ${movieName}`);
  
  const movieData = await getMovieData(movieName);
  if (!movieData) {
    console.log('❌ Movie not found');
    process.exit(1);
  }
  
  const blogHTML = createBlogPost(movieData, movieName);
  const postUrl = await postToBlogger(blogHTML, movieData.title);
  
  console.log(`✅ LIVE: ${postUrl}`);
}

async function getMovieData(name) {
  try {
    console.log('🔍 TMDB...');
    const tmdbSearch = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_KEY}&query=${encodeURIComponent(name)}&language=en-US`
    );
    
    const movie = tmdbSearch.data.results[0];
    if (!movie) return null;
    
    console.log('📋 Details...');
    const details = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.TMDB_KEY}&language=en-US&append_to_response=credits`
    );
    
    let imdbRating = 'N/A';
    try {
      const omdb = await axios.get(
        `http://www.omdbapi.com/?t=${encodeURIComponent(name)}&apikey=${process.env.OMDB_KEY}`
      );
      imdbRating = omdb.data.imdbRating ? `${omdb.data.imdbRating}/10` : 'N/A';
    } catch(e) {}

    return {
      title: movie.title,
      story: movie.overview,
      poster: `https://image.tmdb.org/t/p/w780${movie.poster_path}`,
      backdrop: `https://image.tmdb.org/t/p/original${movie.backdrop_path}`,
      rating: movie.vote_average,
      imdb: imdbRating,
      date: movie.release_date,
      runtime: details.data.runtime || '120',
      genres: details.data.genres?.map(g => g.name).join(', ') || 'Drama',
      director: details.data.credits.crew.find(c => c.job === 'Director')?.name || 'N/A',
      cast: details.data.credits.cast.slice(0, 4).map(c => c.name).join(', ')
    };
  } catch(e) {
    console.error('❌ Movie error:', e.message);
    return null;
  }
}

function createBlogPost(data, name) {
  const stars = '⭐'.repeat(Math.floor(data.rating));
  const fire = data.rating >= 8 ? '🔥 ' : '';
  
  return `<div style="font-family: 'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.7;">
<h1 style="color:#e74c3c;text-align:center;font-size:2.2em;">🎬 ${data.title} ${fire}${stars}</h1>
<p style="text-align:center;color:#7f8c8d;">Latest Movie Review</p>
<img src="${data.poster}" style="width:100%;max-width:600px;border-radius:15px;display:block;margin:25px auto;">
<h2 style="color:#2c3e50;border-bottom:3px solid #e74c3c;">📖 Story</h2>
<div style="background:#f8f9fa;padding:25px;border-radius:12px;">${data.story}</div>
<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;border-radius:15px;">
<h3>📊 Stats</h3>
TMDB: ${data.rating}/10 ${stars} | IMDb: ${data.imdb} | ${data.runtime}min | ${data.director}
</div>
<p><strong>Cast:</strong> ${data.cast}</p>
<img src="${data.backdrop}" style="width:100%;height:400px;object-fit:cover;border-radius:15px;">
<div style="text-align:center;padding:20px;background:#ecf0f1;border-radius:10px;">
<em>🎥 StreamBox2 Movie Bot #${name.replace(/ /g,'')}</em>
</div></div>`;
}

async function postToBlogger(html, title) {
  const email = process.env.BLOGGER_EMAIL;
  const appPassword = process.env.BLOGGER_APP_PASSWORD;
  const blogId = 'streambox2';
  
  const auth = Buffer.from(`${email}:${appPassword}`).toString('base64');
  
  const postData = {
    kind: 'blogger#post',
    title: `${title} | Movie Review ⭐🔥`,
    content: html,
    status: 'PUBLISHED',
    labels: ['Movie', 'Review', 'StreamBox2']
  };
  
  const response = await fetch(
    `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    }
  );
  
  const result = await response.json();
  
  if (response.ok) {
    const postId = result.url.split('/').pop();
    return `https://streambox2.blogspot.com/${postId}`;
  } else {
    console.error('❌ ERROR:', result);
    throw new Error(result.error?.message || 'Failed');
  }
}

main().catch(console.error);
