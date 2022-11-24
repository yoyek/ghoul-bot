import {
  SERVER_PORT,
  REMOVE_TEST_TWIT_AFTER
} from './app/config/index.js'
import express from 'express'
import bodyParser from 'body-parser'
import { Roarr as log } from 'roarr'
import { sendGhoulTwit, deleteGhoulTwit } from './app/lib/twitter.js'
import { processSentinelEvents, saveSentinelJson, loadSentinelByTx } from './app/lib/sentinel.js'

const server = express()
server.use(bodyParser.json({ limit: '10mb' }))

/* ROUTE: Sentinel WebHook
 */

server.post("/webhook", async (req, res) => {

  // Show debug info on request output (default false - don't show)
  const debug = req.query.debug && req.query.debug === '1'

  // Do not log sentinel request to txlog folder (default false - do save)
  const skipLog = req.query.skipLog && req.query.skipLog === '1'

  // Do not post on twitter (default false - do post)
  const skipTwit = req.query.skipTwit && req.query.skipTwit === '1'

  let txInfo = null
  let twitInfo = null

  // Save sentinel body to txlog file
  if (!skipLog) {
    try {
      await saveSentinelJson(req.body)
    } catch (err) {
      log(err)
    }
  }

  // Process sentinel body to complete data for bot
  if (req.body && req.body.events) {
    txInfo = await processSentinelEvents(req.body.events)
  }

  // Post to twitter
  if (!skipTwit && txInfo) {
    twitInfo = await sendGhoulTwit(txInfo)
  }

  debug ? res.send({ ...txInfo, ...twitInfo }) : res.send("OK")
})

/* ROUTE: Debug saved Sentinel request
 */

server.get("/txevent", async (req, res) => {

  // Tx hash
  const tx = req.query.tx

  // Post to twitter (default false)
  const doTwit = req.query.twit && req.query.twit === '1'

  let txInfo = null
  let twitInfo = null

  // Load events from saved file
  const events = loadSentinelByTx(tx)

  if (!events) {
    return res.status(404).send('TX event not found')
  }

  // Process sentinel body to complete data for bot
  txInfo = await processSentinelEvents(events)

  if (!txInfo) {
    return res.status(404).send('Unable to process TX event')
  }

  // Post to twitter if specified in url query string
  if (doTwit) {
    twitInfo = await sendGhoulTwit(txInfo)

    if (REMOVE_TEST_TWIT_AFTER && twitInfo.twitResponse.id) {

      log(`Twit set for autodeleting after ${REMOVE_TEST_TWIT_AFTER} seconds`)

      setTimeout(async () => {
        log(`Auto deleting Twit #${twitInfo.twitResponse.id_str}`)

        try {
          await deleteGhoulTwit(twitInfo.twitResponse.id_str)
        } catch (err) {
          log(`Cannot delete that twit: ${err.message}`)
        }
      }, REMOVE_TEST_TWIT_AFTER * 1000)
    }
  }

  // Output debu info
  res.send({ ...txInfo, ...twitInfo })
})

// Start server
server.listen(
  SERVER_PORT, 
  () => log(`🚀 Bot server running on port ${SERVER_PORT}`)
)
