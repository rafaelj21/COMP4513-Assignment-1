# COMP 4513 Assignment 1: Art API

## Overview
This repository contains the backend Node.js and Express API for Assignment 1. The application queries art history data from a cloud-based Supabase PostgreSQL database and serves it in JSON format.

## Built With
* **Node.js** - JavaScript runtime
* **Express** - Routing and server management
* **Supabase** - Cloud DBMS
* **Render** - Cloud hosting

## Project Files
| File | Description |
| --- | --- |
| `server.js` | Contains all Express server routes, database queries, and error handling. |
| `package.json` | Manages project dependencies (`express`, `@supabase/supabase-js`, `dotenv`, `cors`). |

## Live Deployment
* **Render URL:** https://comp4513-assignment-1-dumu.onrender.com

## API Endpoints & Testing Links

### Eras & Galleries
- https://comp4513-assignment-1-dumu.onrender.com/api/eras
- https://comp4513-assignment-1-dumu.onrender.com/api/galleries
- https://comp4513-assignment-1-dumu.onrender.com/api/galleries/30
- https://comp4513-assignment-1-dumu.onrender.com/api/galleries/calgary
- https://comp4513-assignment-1-dumu.onrender.com/api/galleries/country/fra

### Artists
- https://comp4513-assignment-1-dumu.onrender.com/api/artists
- https://comp4513-assignment-1-dumu.onrender.com/api/artists/12
- https://comp4513-assignment-1-dumu.onrender.com/api/artists/1223423
- https://comp4513-assignment-1-dumu.onrender.com/api/artists/search/ma
- https://comp4513-assignment-1-dumu.onrender.com/api/artists/search/mA
- https://comp4513-assignment-1-dumu.onrender.com/api/artists/country/fra

### Genres
- https://comp4513-assignment-1-dumu.onrender.com/api/genres
- https://comp4513-assignment-1-dumu.onrender.com/api/genres/76
- https://comp4513-assignment-1-dumu.onrender.com/api/genres/painting/408
- https://comp4513-assignment-1-dumu.onrender.com/api/genres/painting/jsdfhg

### Paintings, Sorting & Pagination
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/single/63
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/sort/title/limit/10
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/sort/year/limit/10
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/sort/absd/limit/10
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/sort/year/limit/asd
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/sort/year/limit
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/sort/year/limit/10/skip/30
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/sort/year/limit/10/skip/30000
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/sort/year/limit/10/skip

### Paintings Search & Filters
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/search/port
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/search/pORt
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/search/connolly
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/years/1800/1850
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/years/1850/1800
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/galleries/5
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/artist/16
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/artist/666
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/genre/78
- https://comp4513-assignment-1-dumu.onrender.com/api/paintings/era/2

### Counts & Aggregations
- https://comp4513-assignment-1-dumu.onrender.com/api/counts/genres
- https://comp4513-assignment-1-dumu.onrender.com/api/counts/artists
- https://comp4513-assignment-1-dumu.onrender.com/api/counts/topgenres/20
- https://comp4513-assignment-1-dumu.onrender.com/api/counts/topgenres/2034958