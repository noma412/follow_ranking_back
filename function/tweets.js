import { timeCreate } from './timeCreate.js'
export const process = (tweets) => {
  let tweetsObject = []

  //name
  const name = tweets.includes.users[0].name
  //screen_name
  const screen_name = tweets.includes.users[0].username

  //添付画像の処理
  let mediaFlg = false
  let mediaBox = {}
  if (tweets.includes.media) {
    tweets.includes.media.forEach((media) => {
      mediaBox[media.media_key] =
        media.type === 'photo' ? `${media.url}?name=small` : ''
    })
    mediaFlg = true
  }

  //引用リツイートの処理
  let rtFlg = false
  let rtBox = {}
  if (tweets.includes.tweets) {
    tweets.includes.tweets.forEach((rt) => {
      const user = tweets.includes.users.filter(
        (value) => value.id === rt.author_id
      )
      const rtValue = {
        icon: user[0].profile_image_url,
        name: user[0].name,
        screen_name: user[0].username,
        time: timeCreate(rt.created_at),
        text: rt.text,
      }
      rtBox[rt.id] = rtValue
    })
    rtFlg = true
  }

  tweets.data.forEach((data) => {
    //icon
    const icon = tweets.includes.users[0].profile_image_url
    //time
    const time = timeCreate(data.created_at)
    //text
    const text = data.text.replace(/\n/g, '<br>')

    //img
    let img = []
    if (data.attachments) {
      data.attachments.media_keys.forEach((key) => {
        img.push(mediaBox[key])
      })
    }

    //reply
    const reply_count = data.public_metrics.reply_count
    //like
    const favorite_count = data.public_metrics.like_count
    //retweet
    const retweet_count = data.public_metrics.retweet_count
    //url
    const url = `https://twitter.com/${screen_name}/status/${data.id}`

    //quote
    let quote = ''
    if (data.referenced_tweets && !tweets.errors) {
      const id = data.referenced_tweets[0].id
      quote = { time: '', text: '', name: '', screen_name: '', icon: '' }
      ;[quote.icon, quote.name, quote.screen_name, quote.time, quote.text] = [
        rtBox[id].icon,
        rtBox[id].name,
        rtBox[id].screen_name,
        rtBox[id].time,
        rtBox[id].text,
      ]
    }

    let tweetObject = {}

    tweetObject.icon = icon
    tweetObject.name = name
    tweetObject.screen_name = screen_name
    tweetObject.time = time
    tweetObject.text = text
    tweetObject.img = img
    tweetObject.quote = quote
    tweetObject.reply_count = reply_count
    tweetObject.favorite_count = favorite_count
    tweetObject.retweet_count = retweet_count
    tweetObject.score = reply_count + favorite_count + retweet_count
    tweetObject.url = url

    tweetsObject.push(tweetObject)
  })
  return tweetsObject
}
