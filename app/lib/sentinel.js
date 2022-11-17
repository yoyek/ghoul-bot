import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { Roarr as log } from 'roarr'

import {
  RESERVOIR_API_BASE,
  CONTRACT_ADDRESS,
  TX_LOG_PATH
} from '../config/index.js'

function processSentinelEvents(events) {
  return new Promise((resolve, reject) => {
    let txInfo = {}

    for (const event of events) {
      if (!event.transaction && !event.transaction.transactionHash) {
        continue
      }

      const contract = CONTRACT_ADDRESS
      const txHash = event.transaction.transactionHash
      const txValue = parseInt(event.value, 16)

      const transfer = event.matchReasons.find
        (reason => reason.type === 'event' && reason.signature.startsWith('Transfer('))

      if (transfer && transfer.params && transfer.params.tokenId) {
        const tokenId = transfer.params.tokenId
        const reservoirApiUrl = `${RESERVOIR_API_BASE}/tokens/${contract}:${tokenId}/activity/v3?limit=20&sortBy=eventTimestamp&includeMetadata=true`

        log({ transferParams: transfer.params })
        log({ reservoirApiUrl })

        txInfo = {
          contract,
          tokenId,
          txValue,
          transferParams: transfer.params,
          reservoirApiUrl,
          reservoir: null,
        }

        // Get data from Reservoir API if it's sale
        axios.get(reservoirApiUrl)
        .then(async ({ data }) => {

          const activities = data.activities.filter(
            a => a.txHash && txHash === a.txHash && a.type === 'sale')

          txInfo.reservoir = activities.length > 0 ? activities[0] : null

          return resolve(txInfo)
        })
        .catch(err => {
          log(err)
          return resolve(txInfo)
        })

      } else {
        return resolve(txInfo)
      }
    }
  })
}

function loadSentinelFiles() {
  const txLogPath = TX_LOG_PATH
  const events = []

  fs.readdirSync(txLogPath)
  .filter(file => path.extname(file).toLowerCase() === '.json')
  .forEach(logFile => {
    const fileJson = JSON.parse(fs.readFileSync(txLogPath + logFile))

    if (fileJson && fileJson.events) {
      events.push({ filename: logFile, data: fileJson })
    }
  })

  return events
}

function loadSentinelByTx(tx) {
  let foundEvents = null
  const eventFiles = loadSentinelFiles()

  eventFiles.forEach(({ data, filename }) => {
    const { events } = data

    events.forEach(event => {
      if (event.transaction.transactionHash === tx) {
        foundEvents = events
      }
    })
  })

  return foundEvents
}

function saveSentinelJson(body) {
  return new Promise(async (resolve, reject) => {
    const dateStr = (new Date()).toISOString()
    const filename = `${dateStr}.json`
    const json = JSON.stringify(body)

    const txLogPath = path.join(TX_LOG_PATH, filename)

    fs.writeFile(txLogPath, json, (err) => {
      if (err) {
        return reject(err)
      }

      return resolve()
    })
  })
}

export { processSentinelEvents, loadSentinelFiles, loadSentinelByTx, saveSentinelJson }
