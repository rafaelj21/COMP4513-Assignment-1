const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Root route
app.get('/', (req, res) => {
    res.json({ message: "Art API Assignment 1" });
});

// 1. ERAS
app.get('/api/eras', async (req, res) => {
    let { data, error } = await supabase.from('eras').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 2. GALLERIES
app.get('/api/galleries', async (req, res) => {
    let { data, error } = await supabase.from('galleries').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/galleries/country/:substring', async (req, res) => {
    let sub = req.params.substring;
    let { data, error } = await supabase.from('galleries').select('*').ilike('galleryCountry', `${sub}%`);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No galleries found matching that country" });
    res.json(data);
});

app.get('/api/galleries/:ref', async (req, res) => {
    let ref = req.params.ref;
    let { data, error } = await supabase.from('galleries').select('*').eq('galleryId', ref);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Gallery not found" });
    res.json(data[0]);
});

// 3. ARTISTS
app.get('/api/artists', async (req, res) => {
    let { data, error } = await supabase.from('artists').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/artists/search/:substring', async (req, res) => {
    let sub = req.params.substring;
    let { data, error } = await supabase.from('artists').select('*').ilike('lastName', `${sub}%`);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No artists found" });
    res.json(data);
});

app.get('/api/artists/country/:substring', async (req, res) => {
    let sub = req.params.substring;
    let { data, error } = await supabase.from('artists').select('*').ilike('nationality', `${sub}%`);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No artists found from that country" });
    res.json(data);
});

app.get('/api/artists/:ref', async (req, res) => {
    let ref = req.params.ref;
    let { data, error } = await supabase.from('artists').select('*').eq('artistId', ref);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Artist not found" });
    res.json(data[0]);
});

// 4. GENRES
app.get('/api/genres', async (req, res) => {
    let { data, error } = await supabase.from('genres').select('*, eras(*)');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/genres/painting/:ref', async (req, res) => {
    let ref = req.params.ref;
    let { data, error } = await supabase.from('paintinggenres').select('genres(*, eras(*))').eq('paintingId', ref);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No genres found for this painting" });

    let genres = data.map(item => item.genres).filter(g => g !== null);
    genres.sort((a, b) => a.genreName.localeCompare(b.genreName));

    if (genres.length === 0) return res.status(404).json({ error: "No genres found" });
    res.json(genres);
});

app.get('/api/genres/:ref', async (req, res) => {
    let ref = req.params.ref;
    let { data, error } = await supabase.from('genres').select('*, eras(*)').eq('genreId', ref);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Genre not found" });
    res.json(data[0]);
});

// 5. PAINTINGS
app.get('/api/paintings/single/:ref', async (req, res) => {
    let ref = req.params.ref;
    let { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').eq('paintingId', ref);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Painting not found" });
    res.json(data[0]);
});

app.get('/api/paintings/search/:substring', async (req, res) => {
    let sub = req.params.substring;
    let { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').ilike('title', `%${sub}%`).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found matching that title" });
    res.json(data);
});

app.get('/api/paintings/years/:start/:end', async (req, res) => {
    let start = parseInt(req.params.start);
    let end = parseInt(req.params.end);

    if (isNaN(start) || isNaN(end)) return res.status(404).json({ error: "Invalid year format" });
    if (end < start) return res.status(400).json({ error: "End year cannot be earlier than start year" });

    let { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').gte('yearOfWork', start).lte('yearOfWork', end).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found in this year range" });
    res.json(data);
});

app.get('/api/paintings/galleries/:ref', async (req, res) => {
    let ref = req.params.ref;
    let { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').eq('galleryId', ref).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this gallery" });
    res.json(data);
});

app.get('/api/paintings/artist/:ref', async (req, res) => {
    let ref = req.params.ref;
    let { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').eq('artistId', ref).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this artist" });
    res.json(data);
});

app.get('/api/paintings/genre/:ref', async (req, res) => {
    let ref = req.params.ref;
    let { data, error } = await supabase.from('paintinggenres').select('paintings!inner(paintingId, title, yearOfWork)').eq('genreId', ref).order('yearOfWork', { referencedTable: 'paintings', ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this genre" });

    let paintings = data.map(item => item.paintings);
    res.json(paintings);
});

app.get('/api/paintings/era/:ref', async (req, res) => {
    let ref = req.params.ref;
    let { data: genres, error: gError } = await supabase.from('genres').select('genreId').eq('eraId', ref);
    if (gError) return res.status(500).json({ error: gError.message });
    if (!genres || genres.length === 0) return res.status(404).json({ error: "Era not found" });

    let genreIds = genres.map(g => g.genreId);
    let { data, error } = await supabase.from('paintinggenres').select('paintings!inner(paintingId, title, yearOfWork)').in('genreId', genreIds).order('yearOfWork', { referencedTable: 'paintings', ascending: true });
    
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this era" });

    let uniquePaintings = new Map();
    data.forEach(item => {
        if (item.paintings) {
            uniquePaintings.set(item.paintings.paintingId, item.paintings);
        }
    });

    let result = Array.from(uniquePaintings.values()).sort((a, b) => a.yearOfWork - b.yearOfWork);
    res.json(result);
});

app.get('/api/paintings/sort/:field/limit/:limit/skip/:skip', async (req, res) => {
    let field = req.params.field.toLowerCase();
    let limit = parseInt(req.params.limit);
    let skip = parseInt(req.params.skip);

    if (isNaN(limit) || isNaN(skip)) return res.status(404).json({ error: "Invalid limit or skip values" });

    let sortCol = 'title';
    if (field === 'year') {
        sortCol = 'yearOfWork';
    } else if (field !== 'title') {
        return res.status(404).json({ error: "Invalid sort field" });
    }

    let { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').order(sortCol, { ascending: true }).range(skip, skip + limit - 1);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this range" });
    res.json(data);
});

app.get('/api/paintings/sort/:field/limit/:limit', async (req, res) => {
    let field = req.params.field.toLowerCase();
    let limit = parseInt(req.params.limit);

    if (isNaN(limit)) return res.status(404).json({ error: "Invalid limit value" });

    let sortCol = 'title';
    if (field === 'year') {
        sortCol = 'yearOfWork';
    } else if (field !== 'title') {
        return res.status(404).json({ error: "Invalid sort field" });
    }

    let query = supabase.from('paintings').select('*, artists(*), galleries(*)').order(sortCol, { ascending: true });
    if (limit > 0) {
        query = query.limit(limit);
    }

    let { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found" });
    res.json(data);
});

// 6. COUNTS
app.get('/api/counts/genres', async (req, res) => {
    let { data: genres } = await supabase.from('genres').select('genreId, genreName');
    let { data: pg } = await supabase.from('paintinggenres').select('genreId');

    let counts = {};
    pg.forEach(item => {
        counts[item.genreId] = (counts[item.genreId] || 0) + 1;
    });

    let result = genres.map(g => ({
        genreName: g.genreName,
        count: counts[g.genreId] || 0
    })).sort((a, b) => a.count - b.count);

    res.json(result);
});

app.get('/api/counts/artists', async (req, res) => {
    let { data: artists } = await supabase.from('artists').select('artistId, firstName, lastName');
    let { data: paintings } = await supabase.from('paintings').select('artistId');

    let counts = {};
    paintings.forEach(item => {
        counts[item.artistId] = (counts[item.artistId] || 0) + 1;
    });

    let result = artists.map(a => {
        let fullName = a.firstName ? `${a.firstName} ${a.lastName}` : a.lastName;
        return {
            artistName: fullName,
            count: counts[a.artistId] || 0
        };
    }).sort((a, b) => b.count - a.count);

    res.json(result);
});

app.get('/api/counts/topgenres/:ref', async (req, res) => {
    let ref = parseInt(req.params.ref);
    if (isNaN(ref)) return res.status(404).json({ error: "Invalid reference number" });

    let { data: genres } = await supabase.from('genres').select('genreId, genreName');
    let { data: pg } = await supabase.from('paintinggenres').select('genreId');

    let counts = {};
    pg.forEach(item => {
        counts[item.genreId] = (counts[item.genreId] || 0) + 1;
    });

    let result = genres.map(g => ({
        genreName: g.genreName,
        count: counts[g.genreId] || 0
    })).filter(g => g.count > ref).sort((a, b) => b.count - a.count);

    if (result.length === 0) return res.status(404).json({ error: "No genres found above that count" });
    res.json(result);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});