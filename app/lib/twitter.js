import {
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
} from '../config/index.js'

import twit from 'twit'
import axios from 'axios'
import { Roarr as log } from 'roarr'

const Twitter = new twit({
  consumer_key: TWITTER_API_KEY,
  consumer_secret: TWITTER_API_SECRET,
  access_token: TWITTER_ACCESS_TOKEN,
  access_token_secret: TWITTER_ACCESS_SECRET
})

function sendGhoulTwit(txInfo) {
  return new Promise(async (resolve, reject) => {
    if (!txInfo.reservoir) {
      return resolve({ twitPosted: false, twitBody: null })
    }

    const { price, token, order, timestamp } = txInfo.reservoir

    let twitPosted = false
    let twitResponse = null

    const etherscanUrl = `https://etherscan.io/nft/${txInfo.contract}/${txInfo.tokenId}`
    const twitBody = `New Ghoul Sale! ${token.tokenName} was bought for ${price} ETH on ${order.source.name}. ${etherscanUrl}`
    const params = { status: twitBody }

    // Upload Ghoul image to twitter and get Media Id
    try {
      const base64Img = await fetchImageBase64(token.tokenImage)
      const mediaIdStr = await uploadTwitterImg(base64Img, token.tokenName)
      if (mediaIdStr) {
        params.media_ids = [mediaIdStr]
      }
    } catch (err) {
      log(err)
    }

    Twitter.post('statuses/update', params, (err, data, response) => {
      if (err) {
        log(err, 'Twitter statuses/update ERROR')
        return resolve({twitPosted, twitBody, twitResponse: err})
      }

      twitPosted = true
      twitResponse = response

      return resolve({twitPosted, twitBody, twitResponse})
    })

  })
}

function uploadTwitterImg(base64Img, altText) {
  return new Promise(async (resolve, reject) => {
    Twitter.post('media/upload', { media_data: base64Img }, (err, data, response) => {
      if (err) {
        return reject(err)
      }

      const mediaId = data.media_id_string
      const meta_params = { media_id: mediaId, alt_text: { text: altText } }

      Twitter.post('media/metadata/create', meta_params, (err, data, response) => {

        if (err) {
          return reject(err)
        }

        resolve(mediaId)
      })
    })
  })
}

function fetchImageBase64(imageUrl) {
  return new Promise(async (resolve, reject) => {
    axios.get(imageUrl, {
      responseType: 'arraybuffer'
    })
    .then(async res => {
      resolve(Buffer.from(res.data).toString('base64'))
    })
    .catch(err => reject(err))
  })
}


export { Twitter, sendGhoulTwit }
