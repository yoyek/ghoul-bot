import 'dotenv/config'
import { Roarr as log } from 'roarr'

process.env.TZ = 'Etc/UTC'

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS
  ? process.env.CONTRACT_ADDRESS.toLowerCase()
  : null

const TWITTER_API_KEY = process.env.TWITTER_API_KEY
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET
const REMOVE_TEST_TWIT_AFTER = process.env.REMOVE_TEST_TWIT_AFTER || 10
const SERVER_PORT = process.env.SERVER_PORT || 3030
const RESERVOIR_API_BASE = process.env.RESERVOIR_API_BASE || 'https://api.reservoir.tools'
const TX_LOG_PATH = process.env.TX_LOG_PATH || './txlog/'

// Required settings
const required = {
  CONTRACT_ADDRESS: CONTRACT_ADDRESS,
  TWITTER_API_KEY: TWITTER_API_KEY,
  TWITTER_API_SECRET: TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN: TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET: TWITTER_ACCESS_SECRET
}

let requiredOk = true

for (const setting in required) {
  if (!required[setting]) {
    log(`Please make sure you enter a valid ${setting} at (file:./.env)`)
    requiredOk = false
  }
}

if (!requiredOk) {
  process.exit(1)
}

export {
  CONTRACT_ADDRESS,
  SERVER_PORT,
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
  RESERVOIR_API_BASE,
  REMOVE_TEST_TWIT_AFTER,
  TX_LOG_PATH
}
