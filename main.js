const express = require('express')
const handlebars = require('express-handlebars')
const mysql = require('mysql2/promise')
const PORT = 3000

// configure connect pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'leisure',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: 4,
    timezone: '+08:00'
})

// SQL
const SQL_GET_NAME_ORDER = 'select name from tv_shows order by name desc limit 20'
const SQL_GET_ALL_BY_NAME = 'select * from tv_shows where name = ?'
const app = express()
app.engine('hbs', handlebars({defaultLayout: 'default.hbs'}))
app.set('view engine', 'hbs')

app.get('/', async (req, res) => {
    const conn = await pool.getConnection()
    try {
        const results = await conn.query(SQL_GET_NAME_ORDER)
        // console.log('results:', results)
        // const television_shows = results[0].map(v => v.name)
        // console.log('television_shows:', television_shows)
        res.status(200)
        res.type('text/html')
        res.render('index', { television_shows: results[0] })
    } catch(e) {
        res.status(500)
        res.type('text/html')
        res.send(JSON.stringify(e))
    } finally {
        conn.release()
    }
})

app.get('/television_shows/:name', async (req, res) => {
    const name = req.params['name']
    const conn = await pool.getConnection()

    try {
        const results = await conn.query(SQL_GET_ALL_BY_NAME, [name])
        const recs = results[0]
        if (recs.length <= 0) {
            res.status(404)
            res.type('text/html')
            res.send(`Not found: ${name}`)
            return
        }
        res.status(200)
        res.format({
            'text/html': () => {
                res.type('text/html')
                res.render('television_shows', {television_shows: recs[0]})
            },
            'application/json': () => {
                res.type('application/json')
                res.json(recs[0])
            },
            'default': () => {
                res.type('text/plain')
                res.send(JSON.stringify(recs[0]))
            }
        })
    } catch(e) {
        res.status(500)
        res.type('text/html')
        res.send(JSON.stringify(e))
    } finally {
        conn.release()
    }

})


// start the server
pool.getConnection()
    .then(conn => {
        console.info('Pinging database...')
        const p0 = Promise.resolve(conn)
        const p1 = conn.ping()
        return Promise.all([p0, p1])
    })
    .then(results => {
        const conn = results[0]
        conn.release()
        app.listen(PORT, () => {
            console.log(`Application started on port ${PORT} at ${new Date()}`)
        })
    })
    .catch(e => {
        console.error('Cannot start server: ', e)
    })

