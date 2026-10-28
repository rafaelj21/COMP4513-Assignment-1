const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Helper to attach artist and gallery info to paintings
async function attachArtistAndGallery(paintings) {
    if (!paintings) return paintings;
    let isArray = Array.isArray(paintings);
    let list = isArray ? paintings : [paintings];

    let artistIds = [...new Set(list.map(p => p.artistID).filter(Boolean))];
    let galleryIds = [...new Set(list.map(p => p.galleryID).filter(Boolean))];

    let artistsMap = {};
    let galleriesMap = {};

    if (artistIds.length > 0) {
        let { data: artists, error } = await supabase.from('artists').select('*').in('artistId', artistIds);
        if (error) throw error;
        if (artists) artists.forEach(a => artistsMap[a.artistId] = a);
    }

    if (galleryIds.length > 0) {
        let { data: galleries, error } = await supabase.from('galleries').select('*').in('galleryId', galleryIds);
        if (error) throw error;
        if (galleries) galleries.forEach(g => galleriesMap[g.galleryId] = g);
    }

    let result = list.map(p => ({
        ...p,
        artists: artistsMap[p.artistID] || null,
        galleries: galleriesMap[p.galleryID] || null
    }));

    return isArray ? result : result[0];
}

// Helper to attach era info to genres (avoids Supabase schema cache relation errors)
async function attachEra(genres) {
    if (!genres) return genres;
    let isArray = Array.isArray(genres);
    let list = isArray ? genres : [genres];

    let eraIds = [...new Set(list.map(g => g.eraID).filter(Boolean))];
    let erasMap = {};

    if (eraIds.length > 0) {
        let { data: eras, error } = await supabase.from('eras').select('*').in('eraId', eraIds);
        if (error) throw error;
        if (eras) eras.forEach(e => erasMap[e.eraId] = e);
    }

    let result = list.map(g => ({
        ...g,
        eras: erasMap[g.eraID] || null
    }));

    return isArray ? result : result[0];
}

app.get('/', (req, res) => {
    res.json({ status: "API is up and running!" });
});

// Eras
app.get('/api/eras', async (req, res) => {
    let { data, error } = await supabase.from('eras').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Galleries
app.get('/api/galleries', async (req, res) => {
    let { data, error } = await supabase.from('galleries').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/galleries/country/:substring', async (req, res) => {
    let sub = req.params.substring;
    let { data, error } = await supabase.from('galleries').select('*').ilike('galleryCountry', `${sub}%`);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No galleries found matching that country." });
    res.json(data);
});

app.get('/api/galleries/:ref', async (req, res) => {
    let ref = req.params.ref;
    if (!isNaN(parseInt(ref)) && /^\d+$/.test(ref)) {
        let { data, error } = await supabase.from('galleries').select('*').eq('galleryId', parseInt(ref));
        if (error) return res.status(500).json({ error: error.message });
        if (!data || data.length === 0) return res.status(404).json({ error: "Gallery not found." });
        return res.json(data[0]);
    } else {
        let { data, error } = await supabase.from('galleries').select('*').ilike('galleryCity', `${ref}%`);
        if (error) return res.status(500).json({ error: error.message });
        if (!data || data.length === 0) return res.status(404).json({ error: "No galleries found for that city." });
        return res.json(data);
    }
});

// Artists
app.get('/api/artists', async (req, res) => {
    let { data, error } = await supabase.from('artists').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/artists/search/:substring', async (req, res) => {
    let sub = req.params.substring;
    let { data, error } = await supabase.from('artists').select('*').ilike('lastName', `${sub}%`);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No artists found with that last name." });
    res.json(data);
});

app.get('/api/artists/country/:substring', async (req, res) => {
    let sub = req.params.substring;
    let { data, error } = await supabase.from('artists').select('*').ilike('nationality', `${sub}%`);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No artists found from that country." });
    res.json(data);
});

app.get('/api/artists/:ref', async (req, res) => {
    let id = req.params.ref;
    let { data, error } = await supabase.from('artists').select('*').eq('artistId', id);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Artist not found." });
    res.json(data[0]);
});

// Genres
app.get('/api/genres', async (req, res) => {
    let { data, error } = await supabase.from('genres').select('*');
    if (error) return res.status(500).json({ error: error.message });
    try {
        let enriched = await attachEra(data);
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/genres/painting/:ref', async (req, res) => {
    let paintingRef = req.params.ref;
    let { data, error } = await supabase.from('paintinggenres').select('*').eq('paintingId', paintingRef);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No genres found for this painting." });

    let genreIds = data.map(item => item.genreId);
    let { data: genresData, error: genresErr } = await supabase.from('genres').select('*').in('genreID', genreIds).order('genreName', { ascending: true });

    if (genresErr) return res.status(500).json({ error: genresErr.message });
    if (!genresData || genresData.length === 0) return res.status(404).json({ error: "No valid genres returned." });

    try {
        let enriched = await attachEra(genresData);
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/genres/:ref', async (req, res) => {
    let id = req.params.ref;
    let { data, error } = await supabase.from('genres').select('*').eq('genreID', id);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Genre not found." });

    try {
        let enriched = await attachEra(data[0]);
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Paintings
app.get('/api/paintings/single/:ref', async (req, res) => {
    let id = req.params.ref;
    let { data, error } = await supabase.from('paintings').select('*').eq('paintingID', id);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Painting not found." });

    try {
        let enriched = await attachArtistAndGallery(data[0]);
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/paintings/search/:substring', async (req, res) => {
    let term = req.params.substring;
    let { data, error } = await supabase.from('paintings').select('*').ilike('title', `%${term}%`).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings matched that search term." });

    try {
        let enriched = await attachArtistAndGallery(data);
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/paintings/years/:start/:end', async (req, res) => {
    let startYear = parseInt(req.params.start);
    let endYear = parseInt(req.params.end);

    if (isNaN(startYear) || isNaN(endYear)) return res.status(400).json({ error: "Invalid year numbers provided." });
    if (endYear < startYear) {
        return res.status(400).json({ error: "Error: End year cannot be earlier than start year." });
    }

    let { data, error } = await supabase.from('paintings').select('*').gte('yearOfWork', startYear).lte('yearOfWork', endYear).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found in that year range." });

    try {
        let enriched = await attachArtistAndGallery(data);
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/paintings/galleries/:ref', async (req, res) => {
    let galRef = req.params.ref;
    let { data, error } = await supabase.from('paintings').select('*').eq('galleryID', galRef).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this gallery." });

    try {
        let enriched = await attachArtistAndGallery(data);
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/paintings/artist/:ref', async (req, res) => {
    let artRef = req.params.ref;
    let { data, error } = await supabase.from('paintings').select('*').eq('artistID', artRef).order('yearOfWork', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this artist." });

    try {
        let enriched = await attachArtistAndGallery(data);
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/paintings/genre/:ref', async (req, res) => {
    let genreRef = req.params.ref;
    let { data, error } = await supabase.from('paintinggenres').select('*').eq('genreId', genreRef);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this genre." });

    let pIds = data.map(item => item.paintingId);
    let { data: paintingsData, error: pErr } = await supabase.from('paintings').select('paintingID, title, yearOfWork').in('paintingID', pIds).order('yearOfWork', { ascending: true });

    if (pErr) return res.status(500).json({ error: pErr.message });
    if (!paintingsData || paintingsData.length === 0) return res.status(404).json({ error: "No paintings found." });
    res.json(paintingsData);
});

app.get('/api/paintings/era/:ref', async (req, res) => {
    let eraRef = req.params.ref;
    let { data: genresData, error: genresErr } = await supabase.from('genres').select('*').eq('eraID', eraRef);
    if (genresErr) return res.status(500).json({ error: genresErr.message });
    if (!genresData || genresData.length === 0) return res.status(404).json({ error: "Era not found." });

    let genreIds = genresData.map(g => g.genreID);
    let { data: pgData, error: pgErr } = await supabase.from('paintinggenres').select('*').in('genreId', genreIds);
    if (pgErr) return res.status(500).json({ error: pgErr.message });
    if (!pgData || pgData.length === 0) return res.status(404).json({ error: "No paintings found for this era." });

    let paintingIds = [...new Set(pgData.map(item => item.paintingId))];
    let { data: paintingsData, error: pErr } = await supabase.from('paintings').select('paintingID, title, yearOfWork').in('paintingID', paintingIds).order('yearOfWork', { ascending: true });

    if (pErr) return res.status(500).json({ error: pErr.message });
    if (!paintingsData || paintingsData.length === 0) return res.status(404).json({ error: "No paintings found." });
    res.json(paintingsData);
});

app.get('/api/paintings/sort/:field/limit/:limit/skip/:skip', async (req, res) => {
    let field = req.params.field.toLowerCase();
    let limit = parseInt(req.params.limit);
    let skip = parseInt(req.params.skip);

    if (isNaN(limit) || isNaN(skip) || limit < 0 || skip < 0) {
        return res.status(400).json({ error: "Invalid limit or skip values." });
    }

    let column = field === 'year' ? 'yearOfWork' : 'title';
    if (field !== 'year' && field !== 'title') return res.status(400).json({ error: "Invalid sort field." });

    let query = supabase.from('paintings').select('*').order(column, { ascending: true });

    if (limit > 0) {
        query = query.range(skip, skip + limit - 1);
    } else {
        query = query.range(skip, skip + 999);
    }

    let { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found for this skip range." });

    try {
        let enriched = await attachArtistAndGallery(data);
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/paintings/sort/:field/limit/:limit', async (req, res) => {
    let field = req.params.field.toLowerCase();
    let limit = parseInt(req.params.limit);

    if (isNaN(limit) || limit < 0) return res.status(400).json({ error: "Invalid limit value." });

    let column = field === 'year' ? 'yearOfWork' : 'title';
    if (field !== 'year' && field !== 'title') return res.status(400).json({ error: "Invalid sort field." });

    let query = supabase.from('paintings').select('*').order(column, { ascending: true });
    if (limit > 0) query = query.limit(limit);

    let { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "No paintings found." });

    try {
        let enriched = await attachArtistAndGallery(data);
        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/paintings/sort/:field/limit', (req, res) => {
    res.status(404).json({ error: "Limit parameter missing." });
});

app.get('/api/paintings/sort/:field/limit/:limit/skip', (req, res) => {
    res.status(404).json({ error: "Skip parameter missing." });
});

// Counts & Aggregations
app.get('/api/counts/genres', async (req, res) => {
    let { data: genres, error: genresErr } = await supabase.from('genres').select('*');
    if (genresErr) return res.status(500).json({ error: genresErr.message });

    let { data: pg, error: pgErr } = await supabase.from('paintinggenres').select('*');
    if (pgErr) return res.status(500).json({ error: pgErr.message });

    let counts = {};
    if (pg) pg.forEach(item => {
        let gId = item.genreId;
        if (gId) counts[gId] = (counts[gId] || 0) + 1;
    });

    let result = (genres || []).map(g => ({
        genreName: g.genreName,
        count: counts[g.genreID] || 0
    })).sort((a, b) => a.count - b.count);

    res.json(result);
});

app.get('/api/counts/artists', async (req, res) => {
    let { data: artists, error: artistsErr } = await supabase.from('artists').select('*');
    if (artistsErr) return res.status(500).json({ error: artistsErr.message });

    let { data: paintings, error: paintingsErr } = await supabase.from('paintings').select('artistID');
    if (paintingsErr) return res.status(500).json({ error: paintingsErr.message });

    let counts = {};
    if (paintings) paintings.forEach(p => {
        let aId = p.artistID;
        if (aId) counts[aId] = (counts[aId] || 0) + 1;
    });

    let result = (artists || []).map(art => ({
        artistName: `${art.firstName || ''} ${art.lastName || ''}`.trim(),
        count: counts[art.artistId] || 0
    })).sort((a, b) => b.count - a.count);

    res.json(result);
});

app.get('/api/counts/topgenres/:ref', async (req, res) => {
    let threshold = parseInt(req.params.ref);
    if (isNaN(threshold) || threshold < 0) return res.status(400).json({ error: "Invalid threshold number." });

    let { data: genres, error: genresErr } = await supabase.from('genres').select('*');
    if (genresErr) return res.status(500).json({ error: genresErr.message });

    let { data: pg, error: pgErr } = await supabase.from('paintinggenres').select('*');
    if (pgErr) return res.status(500).json({ error: pgErr.message });

    let counts = {};
    if (pg) pg.forEach(item => {
        let gId = item.genreId;
        if (gId) counts[gId] = (counts[gId] || 0) + 1;
    });

    let result = (genres || []).map(g => ({
        genreName: g.genreName,
        count: counts[g.genreID] || 0
    })).filter(item => item.count > threshold).sort((a, b) => b.count - a.count);

    if (result.length === 0) return res.status(404).json({ error: "No genres found above that count." });
    res.json(result);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});