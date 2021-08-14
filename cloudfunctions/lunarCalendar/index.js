// 云函数入口文件
const cloud = require('wx-server-sdk')
const tcbRouter = require('tcb-router')
const rp = require('request-promise')

cloud.init()


// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const APPKEY_NEWS = '07e728098f9029e06655abfaafa9d2be'
  const APPKEY_LUNAR = '997fd1f50e228c327f2de70d46b9ec0b'

  let date = new Date()
  let month = ''
  let today = ''

  month = date.getMonth() < 10 ? `0${date.getMonth()+1}` : `${date.getMonth() + 1}`
  today = date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`

  let nowTimeStr =  `${date.getFullYear()}-${month}-${today}`

  let NEWS_URL = `http://v.juhe.cn/toutiao/index?key=${APPKEY_NEWS}&type=`
  let LUNAR_URL = `http://v.juhe.cn/laohuangli/d?date=${nowTimeStr}&key=${APPKEY_LUNAR}`
  let news_types = ['top', 'guonei', 'guoji', 'yule', 'tiyu','junshi', 'keji', 'caijing', 'shishang', 'youxi', 'qiche', 'jiankang']



  const result_lunar = await rp(LUNAR_URL)
  const lunarToJsonData = JSON.parse(result_lunar)


  const return_data = await db.collection('lunarCalendarAndNews').get()
  if (return_data.data) {
    await db.collection('lunarCalendarAndNews').where({
      desc: 'lunar'
    }).remove()

    await db.collection('lunarCalendarAndNews').where({
      desc: 'news'
    }).remove()

    await db.collection('lunarCalendarAndNews').add({
      data: {
        ...lunarToJsonData.result,
        desc: 'lunar'
      }
    })
    
    news_types.forEach(async (value) => {
      const result_news =  await rp(NEWS_URL + value)
      const newsToJsonData = JSON.parse(result_news)

      await db.collection('lunarCalendarAndNews').add({
        data: {
          ...newsToJsonData.result,
          desc: 'news'
        }
      })
    })
  }
}