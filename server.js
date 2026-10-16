const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Supabase connection using env variables
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.get('/', (req, res) => {
    res.json({ status: "API is up and running!" });
});

// 1. Eras route
app.get('/api/eras', async function(req, res) {
    console.log("Fetching all eras...");
    let { data: eras, error } = await supabase.from('eras').select('*');
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json(eras);
});

// 2. Galleries routes
app.get('/api/galleries', async (req, res) => {
    let response = await supabase.from('galleries').select('*');
    if (response.error) return res.status(500).json({ error: response.error.message });
    res.json(response.data);
});

app.get('/api/galleries/country/:substring', async function(req, res) {
    let countrySub = req.params.substring;
    let { data, error } = await supabase.from('galleries').select('*').ilike('galleryCountry', `${countrySub}%`);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) {
        return res.status(404).json({ error: "No galleries found matching that country." });
    }
    res.json(data);
});

app.get('/api/galleries/:ref', async (req, res) => {
    let galleryIdNum = req.params.ref;
    let queryResult = await supabase.from('galleries').select('*').eq('galleryId', galleryIdNum);
    if (queryResult.error) return res.status(500).json({ error: queryResult.error.message });
    if (!queryResult.data || queryResult.data.length === 0) {
        return res.status(404).json({ error: "Gallery reference does not exist." });
    }
    res.json(queryResult.data[0]);
});

// 3. Artists routes
app.get('/api/artists', async function(req, res) {
    let { data: artistsData, error } = await supabase.from('artists').select('*');
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json(artistsData);
});

app.get('/api/artists/search/:substring', async (req, res) => {
    let lastNameQuery = req.params.substring;
    let { data, error } = await supabase.from('artists').select('*').ilike('lastName', `${lastNameQuery}%`);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) {
        return res.status(404).json({ error: "No artists found with that last name." });
    }
    res.json(data);
});

app.get('/api/artists/country/:substring', async function(req, res) {
    let nationalitySub = req.params.substring;
    let { data, error } = await supabase.from('artists').select('*').ilike('nationality', `${nationalitySub}%`);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No artists found from that country." });
    res.json(data);
});

app.get('/api/artists/:ref', async (req, res) => {
    let artistIdNum = req.params.ref;
    let { data, error } = await supabase.from('artists').select('*').eq('artistId', artistIdNum);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Artist ID not found." });
    res.json(data[0]);
});

// 4. Genres routes
app.get('/api/genres', async function(req, res) {
    // Need to include all era fields as per instructions
    let { data, error } = await supabase.from('genres').select('*, eras(*)');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/genres/painting/:ref', async (req, res) => {
    let paintingIdNum = req.params.ref;
    let { data, error } = await supabase.from('paintinggenres').select('genres(*, eras(*))').eq('paintingId', paintingIdNum);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) {
        return res.status(404).json({ error: "Genres for this painting were not found." });
    }
    
    // Extract nested genres and sort alphabetically by genreName
    let genresArray = data.map(item => item.genres).filter(g => g !== null);
    genresArray.sort((a, b) => a.genreName.localeCompare(b.genreName));

    if (genresArray.length === 0) return res.status(404).json({ error: "No valid genres returned." });
    res.json(genresArray);
});

app.get('/api/genres/:ref', async function(req, res) {
    let genreIdNum = req.params.ref;
    let { data, error } = await supabase.from('genres').select('*, eras(*)').eq('genreId', genreIdNum);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Genre ID not found." });
    res.json(data[0]);
});

// 5. Paintings routes
app.get('/api/paintings/single/:ref', async (req, res) => {
    let paintingIdNum = req.params.ref;
    let { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').eq('paintingId', paintingIdNum);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Painting not found." });
    res.json(data[0]);
});

app.get('/api/paintings/search/:substring', async function(req, res) {
    let titleTerm = req.params.substring;
    let { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').ilike('title', `%${titleTerm}%`).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings matched that search term." });
    res.json(data);
});

app.get('/api/paintings/years/:start/:end', async (req, res) => {
    let startYear = parseInt(req.params.start);
    let endYear = parseInt(req.params.end);
    
    if (isNaN(startYear) || isNaN(endYear)) return res.status(404).json({ error: "Invalid year numbers provided." });
    if (endYear < startYear) {
        return res.status(400).json({ error: "Error: End year cannot be earlier than start year." });
    }

    let { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').gte('yearOfWork', startYear).lte('yearOfWork', endYear).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found in that year range." });
    res.json(data);
});

app.get('/api/paintings/galleries/:ref', async function(req, res) {
    let galleryRef = req.params.ref;
    let { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').eq('galleryId', galleryRef).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this gallery." });
    res.json(data);
});

app.get('/api/paintings/artist/:ref', async (req, res) => {
    let artistRef = req.params.ref;
    let { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').eq('artistId', artistRef).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this artist." });
    res.json(data);
});

app.get('/api/paintings/genre/:ref', async function(req, res) {
    let genreRef = req.params.ref;
    let { data, error } = await supabase.from('paintinggenres').select('paintings!inner(paintingId, title, yearOfWork)').eq('genreId', genreRef).order('yearOfWork', { referencedTable: 'paintings', ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this genre." });
    
    let paintingResults = data.map(row => row.paintings);
    res.json(paintingResults);
});

app.get('/api/paintings/era/:ref', async (req, res) => {
    let eraRef = req.params.ref;
    let { data: genresData, error: genresErr } = await supabase.from('genres').select('genreId').eq('eraId', eraRef);
    if (genresErr) return res.status(500).json({ error: genresErr.message });
    if (!genresData || genresData.length === 0) return res.status(404).json({ error: "Era reference not found." });

    let idsList = genresData.map(g => g.genreId);
    let { data, error } = await supabase.from('paintinggenres').select('paintings!inner(paintingId, title, yearOfWork)').in('genreId', idsList).order('yearOfWork', { referencedTable: 'paintings', ascending: true });
    
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this era." });

    let uniquePaintingsMap = new Map();
    data.forEach(entry => {
        if (entry.paintings) {
            uniquePaintingsMap.set(entry.paintings.paintingId, entry.paintings);
        }
    });

    let sortedEraPaintings = Array.from(uniquePaintingsMap.values()).sort((a, b) => a.yearOfWork - b.yearOfWork);
    res.json(sortedEraPaintings);
});

app.get('/api/paintings/sort/:field/limit/:limit/skip/:skip', async function(req, res) {
    let sortFieldInput = req.params.field.toLowerCase();
    let limitNum = parseInt(req.params.limit);
    let skipNum = parseInt(req.params.skip);

    if (isNaN(limitNum) || isNaN(skipNum)) return res.status(404).json({ error: "Invalid limit or skip parameters." });

    let dbColumn = 'title';
    if (sortFieldInput === 'year') {
        dbColumn = 'yearOfWork';
    } else if (sortFieldInput !== 'title') {
        return res.status(404).json({ error: "Invalid sort field specified." });
    }

    let { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').order(dbColumn, { ascending: true }).range(skipNum, skipNum + limitNum - 1);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found in this skip range." });
    res.json(data);
});

app.get('/api/paintings/sort/:field/limit/:limit', async (req, res) => {
    let sortFieldInput = req.params.field.toLowerCase();
    let limitNum = parseInt(req.params.limit);

    if (isNaN(limitNum)) return res.status(404).json({ error: "Invalid limit parameter." });

    let dbColumn = 'title';
    if (sortFieldInput === 'year') {
        dbColumn = 'yearOfWork';
    } else if (sortFieldInput !== 'title') {
        return res.status(404).json({ error: "Invalid sort field specified." });
    }

    let queryBuilder = supabase.from('paintings').select('*, artists(*), galleries(*)').order(dbColumn, { ascending: true });
    if (limitNum > 0) {
        queryBuilder = queryBuilder.limit(limitNum);
    }

    let { data, error } = await queryBuilder;
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found." });
    res.json(data);
});

// 6. Counts & Aggregations routes
app.get('/api/counts/genres', async function(req, res) {
    let { data: genresList } = await supabase.from('genres').select('genreId, genreName');
    let { data: paintingGenresList } = await supabase.from('paintinggenres').select('genreId');

    let countsMap = {};
    paintingGenresList.forEach(row => {
        countsMap[row.genreId] = (countsMap[row.genreId] || 0) + 1;
    });

    let finalGenreCounts = genresList.map(g => ({
        genreName: g.genreName,
        count: countsMap[g.genreId] || 0
    })).sort((a, b) => a.count - b.count);

    res.json(finalGenreCounts);
});

app.get('/api/counts/artists', async (req, res) => {
    let { data: artistsList } = await supabase.from('artists').select('artistId, firstName, lastName');
    let { data: paintingsList } = await supabase.from('paintings').select('artistId');

    let countsMap = {};
    paintingsList.forEach(p => {
        countsMap[p.artistId] = (countsMap[p.artistId] || 0) + 1;
    });

    let finalArtistCounts = artistsList.map(artist => {
        let fullName = artist.firstName ? `${artist.firstName} ${artist.lastName}` : artist.lastName;
        return {
            artistName: fullName,
            count: countsMap[artist.artistId] || 0
        };
    }).sort((a, b) => b.count - a.count);

    res.json(finalArtistCounts);
});

app.get('/api/counts/topgenres/:ref', async function(req, res) {
    let thresholdNum = parseInt(req.params.ref);
    if (isNaN(thresholdNum)) return res.status(404).json({ error: "Invalid threshold value." });

    let { data: genresList } = await supabase.from('genres').select('genreId, genreName');
    let { data: paintingGenresList } = await supabase.from('paintinggenres').select('genreId');

    let countsMap = {};
    paintingGenresList.forEach(row => {
        countsMap[row.genreId] = (countsMap[row.genreId] || 0) + 1;
    });

    let topGenresResult = genresList.map(g => ({
        genreName: g.genreName,
        count: countsMap[g.genreId] || 0
    })).filter(item => item.count > thresholdNum).sort((a, b) => b.count - a.count);

    if (topGenresResult.length === 0) return res.status(404).json({ error: "No genres exceed this painting count." });
    res.json(topGenresResult);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 