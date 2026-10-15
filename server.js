const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Root
app.get('/', (req, res) => {
    res.json({ message: "COMP4513 Assignment 1 API" });
});

// ERAS
app.get('/api/eras', async (req, res) => {
    const { data, error } = await supabase.from('eras').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GALLERIES
app.get('/api/galleries', async (req, res) => {
    const { data, error } = await supabase.from('galleries').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/galleries/country/:substring', async (req, res) => {
    const sub = req.params.substring;
    const { data, error } = await supabase.from('galleries').select('*').ilike('galleryCountry', `${sub}%`);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data);
});

app.get('/api/galleries/:ref', async (req, res) => {
    const ref = req.params.ref;
    const { data, error } = await supabase.from('galleries').select('*').eq('galleryId', ref);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data[0]);
});

// ARTISTS
app.get('/api/artists', async (req, res) => {
    const { data, error } = await supabase.from('artists').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/artists/search/:substring', async (req, res) => {
    const sub = req.params.substring;
    const { data, error } = await supabase.from('artists').select('*').ilike('lastName', `${sub}%`);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data);
});

app.get('/api/artists/country/:substring', async (req, res) => {
    const sub = req.params.substring;
    const { data, error } = await supabase.from('artists').select('*').ilike('nationality', `${sub}%`);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data);
});

app.get('/api/artists/:ref', async (req, res) => {
    const ref = req.params.ref;
    const { data, error } = await supabase.from('artists').select('*').eq('artistId', ref);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data[0]);
});

// GENRES
app.get('/api/genres', async (req, res) => {
    const { data, error } = await supabase.from('genres').select('*, eras(*)');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/genres/painting/:ref', async (req, res) => {
    const ref = req.params.ref;
    const { data, error } = await supabase.from('paintinggenres').select('genres(*, eras(*))').eq('paintingId', ref);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    
    const genres = data.map(item => item.genres).filter(g => g !== null).sort((a, b) => a.genreName.localeCompare(b.genreName));
    if (genres.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(genres);
});

app.get('/api/genres/:ref', async (req, res) => {
    const ref = req.params.ref;
    const { data, error } = await supabase.from('genres').select('*, eras(*)').eq('genreId', ref);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data[0]);
});

// PAINTINGS
app.get('/api/paintings/single/:ref', async (req, res) => {
    const ref = req.params.ref;
    const { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').eq('paintingId', ref);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data[0]);
});

app.get('/api/paintings/search/:substring', async (req, res) => {
    const sub = req.params.substring;
    const { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').ilike('title', `%${sub}%`).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data);
});

app.get('/api/paintings/years/:start/:end', async (req, res) => {
    const start = parseInt(req.params.start);
    const end = parseInt(req.params.end);
    if (isNaN(start) || isNaN(end)) return res.status(404).json({ error: "Invalid years" });
    if (end < start) return res.status(400).json({ error: "End year cannot be earlier than start year" });

    const { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').gte('yearOfWork', start).lte('yearOfWork', end).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data);
});

app.get('/api/paintings/galleries/:ref', async (req, res) => {
    const ref = req.params.ref;
    const { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').eq('galleryId', ref).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data);
});

app.get('/api/paintings/artist/:ref', async (req, res) => {
    const ref = req.params.ref;
    const { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').eq('artistId', ref).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data);
});

app.get('/api/paintings/genre/:ref', async (req, res) => {
    const ref = req.params.ref;
    const { data, error } = await supabase.from('paintinggenres').select('paintings!inner(paintingId, title, yearOfWork)').eq('genreId', ref).order('yearOfWork', { referencedTable: 'paintings', ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data.map(item => item.paintings));
});

app.get('/api/paintings/era/:ref', async (req, res) => {
    const ref = req.params.ref;
    const { data: genres, error: gErr } = await supabase.from('genres').select('genreId').eq('eraId', ref);
    if (gErr) return res.status(500).json({ error: gErr.message });
    if (!genres || genres.length === 0) return res.status(404).json({ error: "Not found" });

    const genreIds = genres.map(g => g.genreId);
    const { data, error } = await supabase.from('paintinggenres').select('paintings!inner(paintingId, title, yearOfWork)').in('genreId', genreIds).order('yearOfWork', { referencedTable: 'paintings', ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });

    const uniqueMap = new Map();
    data.forEach(item => {
        if (item.paintings) uniqueMap.set(item.paintings.paintingId, item.paintings);
    });
    res.json(Array.from(uniqueMap.values()).sort((a, b) => a.yearOfWork - b.yearOfWork));
});

app.get('/api/paintings/sort/:field/limit/:limit/skip/:skip', async (req, res) => {
    const field = req.params.field.toLowerCase();
    const limit = parseInt(req.params.limit);
    const skip = parseInt(req.params.skip);
    if (isNaN(limit) || isNaN(skip)) return res.status(404).json({ error: "Invalid parameters" });

    let col = field === 'year' ? 'yearOfWork' : 'title';
    const { data, error } = await supabase.from('paintings').select('*, artists(*), galleries(*)').order(col, { ascending: true }).range(skip, skip + limit - 1);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data);
});

app.get('/api/paintings/sort/:field/limit/:limit', async (req, res) => {
    const field = req.params.field.toLowerCase();
    const limit = parseInt(req.params.limit);
    if (isNaN(limit)) return res.status(404).json({ error: "Invalid limit" });

    let col = field === 'year' ? 'yearOfWork' : 'title';
    let query = supabase.from('paintings').select('*, artists(*), galleries(*)').order(col, { ascending: true });
    if (limit > 0) query = query.limit(limit);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(data);
});

// COUNTS
app.get('/api/counts/genres', async (req, res) => {
    const { data: genres } = await supabase.from('genres').select('genreId, genreName');
    const { data: pg } = await supabase.from('paintinggenres').select('genreId');
    
    const counts = {};
    pg.forEach(item => counts[item.genreId] = (counts[item.genreId] || 0) + 1);
    
    const result = genres.map(g => ({ genreName: g.genreName, count: counts[g.genreId] || 0 })).sort((a, b) => a.count - b.count);
    res.json(result);
});

app.get('/api/counts/artists', async (req, res) => {
    const { data: artists } = await supabase.from('artists').select('artistId, firstName, lastName');
    const { data: paintings } = await supabase.from('paintings').select('artistId');
    
    const counts = {};
    paintings.forEach(item => counts[item.artistId] = (counts[item.artistId] || 0) + 1);
    
    const result = artists.map(a => ({
        artistName: a.firstName ? `${a.firstName} ${a.lastName}` : a.lastName,
        count: counts[a.artistId] || 0
    })).sort((a, b) => b.count - a.count);
    res.json(result);
});

app.get('/api/counts/topgenres/:ref', async (req, res) => {
    const ref = parseInt(req.params.ref);
    if (isNaN(ref)) return res.status(404).json({ error: "Invalid reference" });

    const { data: genres } = await supabase.from('genres').select('genreId, genreName');
    const { data: pg } = await supabase.from('paintinggenres').select('genreId');
    
    const counts = {};
    pg.forEach(item => counts[item.genreId] = (counts[item.genreId] || 0) + 1);
    
    const result = genres.map(g => ({ genreName: g.genreName, count: counts[g.genreId] || 0 }))
                         .filter(g => g.count > ref)
                         .sort((a, b) => b.count - a.count);
                         
    if (result.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});