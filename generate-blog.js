const axios = require('axios');
const fetch = require('node-fetch');

async function main() {
  const movieName = process.env.MOVIE_NAME || 'Oppenheimer';
  
  console.log(`🎥 Processing: ${movieName}`);
  
  // 1. Get movie data
  const movieData = await getMovieData(movieName);
  if (!movieData) {
    console.log('❌ Movie not found');
    return;
  }
  
  // 2. Generate blog HTML
  const blogHTML = createBlogPost(movieData, movieName);
  
  // 3. Post to YOUR Blogger (streambox2)
  await postToBlogger(blogHTML, movieData.title);
  
  console.log('✅ Posted to https://streambox2.blogspot.com!');
}

async function getMovieData(name) {
  try {
    console.log('🔍 Searching TMDB...');
    const tmdbSearch = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_KEY}&query=${encodeURIComponent(name)}&language=en-US`
    );
    
    const movie = tmdbSearch.data.results[0];
    if (!movie) return null;
    
    console.log('📋 Getting details...');
    const details = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.TMDB_KEY}&language=en-US&append_to_response=credits`
    );
    
    let imdbRating = 'N/A';
    try {
      console.log('⭐ Getting IMDb...');
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
    console.error('❌ Movie fetch error:', e.message);
    return null;
  }
}

function createBlogPost(data, name) {
  const stars = '⭐'.repeat(Math.floor(data.rating));
  const fire = data.rating >= 8 ? '🔥 ' : '';
  
  return `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.7;">
  
<h1 style="color: #e74c3c; text-align: center; font-size: 2.2em; margin-bottom: 10px;">
  🎬 ${data.title} ${fire}${stars}
</h1>
<p style="text-align: center; color: #7f8c8d; font-size: 1.1em;">Latest Movie Review & Story</p>

<img src="${data.poster}" alt="${data.title}" style="width: 100%; max-width: 600px; height: auto; border-radius: 15px; display: block; margin: 25px auto; box-shadow: 0 15px 35px rgba(0,0,0,0.3);">

<h2 style="color: #2c3e50; border-bottom: 3px solid #e74c3c; padding-bottom: 10px;">📖 Movie Story</h2>
<div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 20px 0; font-size: 16px; color: #34495e;">
  ${data.story || 'A captivating cinematic journey filled with drama, emotion, and unforgettable moments. This film delivers powerful storytelling that resonates long after the credits roll.'}
</div>

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin: 30px 0;">
  <h3 style="margin-top: 0; font-size: 1.4em;">📊 Quick Stats</h3>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 15px;">
    <div><strong>🎯 TMDB Rating:</strong> ${data.rating}/10 ${stars}</div>
    <div><strong>⭐ IMDb:</strong> ${data.imdb}</div>
    <div><strong>⏱️ Runtime:</strong> ${data.runtime} minutes</div>
    <div><strong>📅 Released:</strong> ${new Date(data.date).toLocaleDateString('en-US')}</div>
    <div><strong>🎬 Director:</strong> ${data.director}</div>
    <div><strong>🏷️ Genres:</strong> ${data.genres}</div>
  </div>
</div>

<h2 style="color: #2c3e50; border-bottom: 3px solid #e74c3c; padding-bottom: 10px;">🎭 Star Cast</h2>
<p style="color: #7f8c8d; font-size: 16px; background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
  ${data.cast || 'Talented ensemble cast delivering powerhouse performances!'} 
</p>

<h2 style="color: #2c3e50; border-bottom: 3px solid #e74c3c; padding-bottom: 10px;">✨ Why Watch ${data.title}?</h2>
<blockquote style="background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%); color: white; padding: 25px; border-radius: 12px; margin: 25px 0; font-style: italic; font-size: 18px; text-align: center;">
  "${getRandomReview(data.rating)} Perfect movie night pick! 🍿🎭"
</blockquote>

<img src="${data.backdrop}" alt="${data.title} Backdrop" style="width: 100%; height: 400px; object-fit: cover; border-radius: 15px; margin: 30px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">

<div style="text-align: center; padding: 20px; background: #ecf0f1; border-radius: 10px; margin-top: 30px;">
  <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
    <em>🎥 Auto-generated by StreamBox2 Movie Bot</em><br>
    <strong>#${name.replace(/ /g, '').replace(/[^a-zA-Z0-9]/g, '')} #MovieReview #StreamBox2</strong>
  </p>
</div>

</div>
  `.trim();
}

async function postToBlogger(html, title) {
  const email = process.env.BLOGGER_EMAIL;
  const password = process.env.BLOGGER_APP_PASSWORD;
  const blogId = 'streambox2';  // ✅ YOUR BLOG ID!
  
  console.log(`📤 Posting to https://streambox2.blogspot.com...`);
  
  const auth = Buffer.from(`${email}:${password}`).toString('base64');
  
  const postData = {
    kind: 'blogger#post',
    title: `${title} | Full Movie Review ⭐🔥`,
    content: html,
    labels: ['Movie Review', 'Latest Movies', 'StreamBox2']
  };
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`,
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
      console.log(`✅ SUCCESS! 🎉`);
      console.log(`🔗 Live: https://streambox2.blogspot.com/${result.url.split('/').pop()}`);
      console.log(`📱 View post: ${result.url}`);
    } else {
      console.log('❌ Post failed:', response.status);
      console.log('Details:', JSON.stringify(result.error, null, 2));
    }
  } catch(e) {
    console.error('❌ Error:', e.message);
  }
}

function getRandomReview(rating) {
  const reviews = [
    'A cinematic masterpiece that redefines storytelling!',
    'Visually breathtaking with powerhouse performances!',
    'Gripping from start to finish - pure entertainment!',
    'Emotional rollercoaster you won\'t forget!',
    'Blockbuster perfection for movie lovers everywhere!'
  ];
  return reviews[Math.floor(Math.random() * reviews.length)];
}

// 🚀 LAUNCH!
main().catch(console.error);
