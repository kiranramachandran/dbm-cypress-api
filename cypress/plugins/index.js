
// cypress/plugins/index.js - (Database task + shell exec)

const { Client } = require('pg') // or mysql2 for MySQL
const { exec } = require('child_process')
module.exports = (on, config) => {
  on('task', {
    async queryDb({ sql, values }) {
      const client = new Client({ connectionString: config.env.DB_URL })
      await client.connect()
      const res = await client.query(sql, values || [])
      await client.end()
      return res.rows
    },
    execShell(cmd) { // execShell uses a larger maxBuffer so stdout from bigger uploads or node scripts won't truncate.
      return new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 1024 * 1024 * 200 }, (err, stdout, stderr) => {
          if(err) return reject(stderr || err)
          resolve(stdout)
        })
      })
    }
  })
}
