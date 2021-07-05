import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import Twitter from 'twitter'
import TwitterV2 from 'twitter-v2'
import fs from 'fs'
import { process } from './function/tweets.js'

const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.options('/', cors())

app.post('/', async (req, res) => {
  const uid = req.body.user_id
  const secret = JSON.parse(
    fs.readFileSync('./assets/json/secret.json', 'utf-8')
  )
  const client = new Twitter(secret)
  const clientV2 = new TwitterV2(secret)
  let response
  let extractionAll = []
  try {
    let idErrorFlg = false
    //IDを取得
    const idContents = await client
      .get('friends/ids', {
        user_id: uid,
        count: 300,
      })
      .catch((e) => {
        if (!idErrorFlg) {
          console.log(`friends/ids${uid}のエラー`)
          console.dir(e, { depth: null })
          idErrorFlg = true
        }
        throw new Error(e[0].message)
      })

    //取得したID(ユーザー)のツイートを取得
    const _date = new Date(req.body.date)
    _date.setDate(_date.getDate() - 1)
    const _year = _date.getFullYear()
    let _month = _date.getMonth() + 1
    _month = _month < 10 ? '0' + _month : _month
    let _day = _date.getDate()
    _day = _day < 10 ? '0' + _day : _day

    const date = new Date(req.body.date)
    const year = date.getFullYear()
    let month = date.getMonth() + 1
    month = month < 10 ? '0' + month : month
    let day = date.getDate()
    day = day < 10 ? '0' + day : day

    const start = `${_year}-${_month}-${_day}T15:00:00Z`
    const end = `${year}-${month}-${day}T14:59:59Z`
    let userErrorFlg = false
    await Promise.all(
      idContents.ids.map(async (id) => {
        const tweets = await clientV2
          .get(`users/${id}/tweets`, {
            start_time: start,
            end_time: end,
            exclude: ['retweets', 'replies'],
            expansions: [
              'author_id',
              'referenced_tweets.id.author_id',
              'attachments.media_keys',
            ],
            'tweet.fields': [
              'created_at',
              'text',
              'entities',
              'public_metrics',
            ],
            'user.fields': [
              'created_at',
              'id',
              'name',
              'username',
              'profile_image_url',
            ],
            'media.fields': ['type', 'url'],
          })
          .catch((e) => {
            if (!userErrorFlg) {
              console.log(`users/${id}/tweetsのエラー`)
              console.dir(e, { depth: null })
              userErrorFlg = true
            }
            throw new Error(e)
          })
        //取得したツイートから必要なデータを抽出
        if (tweets.data) {
          let extractionTweets = process(tweets)
          if (extractionTweets.length) extractionAll.push(extractionTweets)
        }
      })
    )

    //データを結合
    let concatExtractionAll
    extractionAll.forEach((tweetsBox, i) => {
      concatExtractionAll =
        i === 0 ? tweetsBox : concatExtractionAll.concat(tweetsBox)
    })

    //並べ替えてレスポンスをセット
    concatExtractionAll.sort((a, b) => (a.score > b.score ? -1 : 1))
    response = concatExtractionAll
    response = response.slice(0, 50)

    res.json(response)
  } catch (e) {
    res.json({ error: e.message })
  }
})

const server = app.listen(1000, () => {
  console.log('サーバー起動')
})
