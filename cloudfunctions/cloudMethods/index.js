// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require('tcb-router')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let { OPENID, APPID, UNIONID } = cloud.getWXContext()
  const app = new TcbRouter({event})
  const db = cloud.database()

  app.use(async (ctx, next) => {
    ctx.data = {}
    ctx.data = {
      code: 0,
      openId : event.userInfo.openId
    }
    await next()
  })


  // 获取当前用户下的随礼人信息
  app.router('getRelativeLists', async (ctx, next) => {

    //当前用户下的记录总数
    let total = 0
    //每一次获取的记录数量
    let MAX_LIMIT = event.max_limit
    //需要分几次查询
    let batchTimes = 0

    // 获取当前用户下的记录总数
    const result = await db.collection('relative').where({
      openId: ctx.data.openId
    }).count()
    total = result.total

    // 通过总记录数与每次获取的记录数计算出需要分几次取
    batchTimes = Math.ceil(total / MAX_LIMIT)

    // 获取到指定条件下的指定数量记录返回给小程序端
    await db.collection('relative').where({
      openId: ctx.data.openId
    }).skip(event.start * MAX_LIMIT).limit(MAX_LIMIT).get().then(res => {
        ctx.data.data = res.data,
        ctx.data.batchTimes = batchTimes,
        ctx.data.msg = 'success',
        ctx.data.code = 200
      }).catch(e => {
        ctx.data.msg = 'fail',
        ctx.data.code = 520
    })
    ctx.body = {
      data: ctx.data
    }
    await next()
  })

  // 统计当前用户下的所有随礼人金额并返回
  app.router('getAllRelativeMoney', async(ctx, next) => {
    //当前用户下的记录总数
    let total = 0
    //每一次获取的记录数量
    let MAX_LIMIT = event.max_limit
    //需要分几次查询
    let batchTimes = 0

    // 临时存放金额的数组（方便最终统计）
    let tempAllMoney = []

    // 所有记录产生的总金额
    let totalMoney = 0

    // 获取当前用户下的记录总数
    const result = await db.collection('relative').where({
      openId: ctx.data.openId
    }).count()
    total = result.total

    // 通过总记录数与每次获取的记录数计算出需要分几次取
    batchTimes = Math.ceil(total / MAX_LIMIT)

    // 在云函数端完成所有记录中的指定字段数据追加
    for (let i = 0; i < batchTimes; i++) {
      await db.collection('relative').where({ 
        openId:ctx.data.openId }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get().then(res => {
          res.data.forEach((value) => {
            tempAllMoney.push(value.money - 0)
          })
      })
    }

    tempAllMoney.forEach((value) => {
      totalMoney += value
    })

    ctx.body = {
      totalMoney: totalMoney
    }

    await next()
  })

  // “新增随礼人信息”
  app.router('addNewRelative', async (ctx, next) => {
    ctx.data.msg = ''
    ctx.data.code = ''
    await db.collection('relative').where({
      name: event.relativeName,
      openId: ctx.data.openId
    }).get().then(res => {
      if (res.data.length) {
        ctx.data.msg = 'success',
        ctx.data.code = 230
      }
    })
    let tempOpenIdArr = []
    let lastSaveArr = []

    // 如果新增随礼人不重复
    if (ctx.data.code != 230){
      let dataLength = await db.collection('relative').where({
        openId: event.openId
      }).skip(0).limit(1).get().then(res => {
        if (res.data.length) {
          tempOpenIdArr = res.data[0].openId
        }
        return res.data.length
      })

      if (dataLength) {
        
        tempOpenIdArr.forEach(value => {
          if (value != event.openId) {
            lastSaveArr.push(value)
          }
        })
        lastSaveArr.push(event.userInfo.openId)
        await db.collection('relative').add({
          data: {
            name: event.relativeName,
            money: event.relativeMoney,
            openId: lastSaveArr,
            amount: 0,
            returnSaluteObj:[]
          }
        }).then(res => {
          ctx.data.msg = 'success',
          ctx.data.code = 200
        }).catch(e => {
          ctx.data.msg = 'fail',
          ctx.data.code = 520
        })
      } else {
        await db.collection('relative').add({
          data: {
            name: event.relativeName,
            money: event.relativeMoney,
            openId: [event.userInfo.openId],
            amount: 0,
            returnSaluteObj:[]
          }
        }).then(res => {
          ctx.data.msg = 'success',
          ctx.data.code = 200
        }).catch(e => {
          ctx.data.msg = 'fail',
          ctx.data.code = 520
        })
      }
    }
    
    ctx.body = {
      data: ctx.data
    }
    await next()
  })

  // 用户删除指定随礼人
  app.router('deleteRelativeById', async (ctx, next) => {
    await db.collection('relative').doc(event.id).remove().then(res => {
      ctx.data.msg = 'success',
      ctx.data.code = 200
    }).catch(e => {
      ctx.data.msg = 'fail',
      ctx.data.code = 520
    })

    ctx.body = {
      data: ctx.data
    }
    await next()
  })

  // 查询指定随礼人信息
  app.router('getRelativeInfoById', async(ctx,next) => {
    await db.collection('relative').doc(event.id).get().then(res => {
      ctx.data.data = res.data
      ctx.data.msg = 'success',
      ctx.data.code = 200
    }).catch(e => {
      ctx.data.msg = 'fail',
      ctx.data.code = 520
    })

    ctx.body = {
      data: ctx.data
    }
  })

  // 更改随礼人信息
  app.router('changeRelativeById', async(ctx, next) => {
    await db.collection('relative').doc(event.id).update({
      data: {
        name: event.relativeName,
        money: event.relativeMoney
      }
    }).then(res => {
      ctx.data.msg = 'success',
      ctx.data.code = 200
    }).catch(e => {
      ctx.data.msg = 'fail',
      ctx.data.code = 520
    })
    ctx.body = {
      data: ctx.data
    }
    await next()
  })

  // 新增回礼名称
  app.router('addReturnASalute', async(ctx, next) => {

    let tempReturnSalutes = []
    await db.collection('relative').doc(event.id).get().then(res => {
      if (res.data) {
        tempReturnSalutes = res.data.returnSaluteObj
      } else {
        ctx.data.msg = 'fail'
        ctx.data.code = 520
        ctx.body = {
          data: ctx.data
        }
        return
      }
    })

      let eName = event.returnSalute.name
      let eMoney = event.returnSalute.money

      tempReturnSalutes.push({
        name: eName,
        money: eMoney
      })

      await db.collection('relative').doc(event.id).update({
        data: {
          returnSaluteObj: tempReturnSalutes
        }
      }).then(res => {
        ctx.data.msg = 'success'
        ctx.data.code = 200
       
      }).catch(e => {
        ctx.data.msg = 'fail'
        ctx.data.code = 520
      })

      ctx.body = {
        data: ctx.data
      }
      await next()
  })

  // 删除回礼名称
  app.router('deleteReturnASalute', async(ctx, next) => {
    let tempReturnSaluteObj = []
    let oldReturnSaluteObj = []
    await db.collection('relative').doc(event.id).get().then(res => {
      oldReturnSaluteObj = res.data.returnSaluteObj

     oldReturnSaluteObj.forEach((value, index) => {
       if (event.number != index) {
        tempReturnSaluteObj.push(value)
       }
     })
    })

    await db.collection('relative').doc(event.id).update({
      data: {
        returnSaluteObj: tempReturnSaluteObj
      }
    }).then(res => {
      ctx.data.msg = 'success'
      ctx.data.code = 200
      ctx.body = {
        data: ctx.data
      }
    })
    await next()
  })

  // 通过邀请码新增家庭成员
  app.router('addOpenIdByInvitationCode' ,async (ctx, next) => {
    //当前用户下的记录总数
    let total = 0
    //每一次获取的记录数量
    let MAX_LIMIT = 50
    //需要分几次查询
    let batchTimes = 0

    // 临时存放金额的数组（方便最终统计）
    let tempAllOpenId = []

    // 所有记录产生的总金额
    let totalMoney = 0

    // 获取当前用户下的记录总数
    const result = await db.collection('relative').where({
      openId: event.oldOpenId
    }).count()
    total = result.total

    // 通过总记录数与每次获取的记录数计算出需要分几次取
    batchTimes = Math.ceil(total / MAX_LIMIT)

    // 在云函数端完成所有记录中的指定字段数据追加
    for (let i = 0; i < batchTimes; i++) {
      await db.collection('relative').where({ 
        openId: event.oldOpenId }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get().then(res => {
          res.data.forEach(async(value) => {
            tempAllOpenId = value.openId
            
            tempAllOpenId.forEach(value => {
              if (value == ctx.data.openId) {
                ctx.data.msg = 'success'
                ctx.data.code = 230
                ctx.body = {
                  data: ctx.data
                }
                return
              }
            })

            if (ctx.data.code != 230) {
              tempAllOpenId.push(ctx.data.openId)
              await db.collection('relative').where({
                openId: event.oldOpenId
              }).update({
                data: {
                  openId: tempAllOpenId
                }
              }).then(res => {
                ctx.data.msg = 'success'
                ctx.data.code = 200
                ctx.body = {
                  data: ctx.data
                }
              }).catch(e => {
                ctx.data.msg = 'fail'
                ctx.data.code = 520
                ctx.body = {
                  data: ctx.data
                }
              })
            }
          })
          if (ctx.data.code != 230) {
            ctx.data.msg = 'success'
            ctx.data.code = 200
          }
      })
    }

    ctx.body = {
      data: ctx.data
    }

    await next()
  })


  app.router('getLunarCalendar', async (ctx, next) => {
    await db.collection('lunarCalendarAndNews').where({
      desc: 'lunar'
    }).get().then(res => {
      ctx.data.data = res.data
      ctx.data.msg = 'success'
      ctx.data.code = 200
    }).catch(e => {
      ctx.data.msg = 'fail'
      ctx.data.code = 520
    })

    ctx.body = {
      data: ctx.data
    }
    await next()
  })


  // 添加权限信息
  app.router('addShareOne', async (ctx, next) => {

    let tempPowerLists = []
    let length = 0
    let result = []

    await db.collection('relative').where({
      desc: 'power'
    }).get().then(res => {
      console.log(":::")
      console.log(res.data)

      res.data.forEach((value, index) => {
        if (value.mainOne == event.openId) {
          console.log("mainOne")
          ctx.data.msg = 'success'
          ctx.data.code = 230
          ctx.data.index = index
          console.log("...")
          console.log(ctx.data.index)
          result = res.data[ctx.data.index]
        }
      })
    })

    if (ctx.data.code != 230) {
      tempPowerLists.push(event.powerList)
      await db.collection('relative').add({
        data:{
          mainOne: event.openId,
          powerLists: tempPowerLists,
          desc: 'power'
        }
      }).then(res => {
        ctx.data.msg = 'success'
        ctx.data.code = 200
      }).catch(e => {
        ctx.data.msg = 'fail'
        ctx.data.code = 520
      })
    }

    if (ctx.data.code === 230) {

      result.powerLists.forEach(value => {
        tempPowerLists.push(value)
      })

      console.log('ddddd')

      await db.collection('relative').where({
        desc: 'power',
        mainOne: event.openId
      }).remove()

      tempPowerLists.push(event.powerList)
      await db.collection('relative').add({
        data:{
          mainOne: event.openId,
          powerLists: tempPowerLists,
          desc: 'power'
        }
      }).then(res => {
        ctx.data.msg = 'success'
        ctx.data.code = 200
      }).catch(e => {
        ctx.data.msg = 'fail'
        ctx.data.code = 520
      })
    }



  
    // await db.collection('relative').where({
    //   mainOne: event.openId
    // }).get().then(res => {
    //   length = res.data.length
    //   if (res.data.length > 0) {
    //     if (res.data[0].mainOne == event.openId) {
    //       ctx.data.msg = 'success'
    //       ctx.data.code = 230
    //       ctx.body = {
    //         data: ctx.data
    //       }
    //     } 
    //   }
    //   if (res.data.length != 0) {
    //     res.data[0].powerLists.forEach(value => {
    //       tempPowerLists.push(value)
    //     })

    //     res.data[0].powerLists.forEach(value => {
    //       if (value.powerOpenId == event.powerList.powerOpenId) {
    //         ctx.data.code = 260
    //       }
    //     })

    //   }
    //   tempPowerLists.push(event.powerList)

     
    // })

    // if (ctx.data.code == 230) {
    //   await db.collection('relative').where({
    //     desc: 'power',
    //     mainOne: event.openId
    //   }).remove()
    // }

    // if (ctx.data.code != 260 || length == 0) {
    //   await db.collection('relative').add({
    //     data:{
    //       mainOne: event.openId,
    //       powerLists: tempPowerLists,
    //       desc: 'power'
    //     }
    //   }).then(res => {
    //     ctx.data.msg = 'success'
    //     ctx.data.code = 200
    //   }).catch(e => {
    //     ctx.data.msg = 'fail'
    //     ctx.data.code = 520
    //   })
    // }

    ctx.body = {
      data: ctx.data
    }

    await next()
  })


  // 获取当前用户下的指定权限信息
  app.router('getPowerByOpenId', async (ctx, next) => {
   await db.collection('relative').where({
     'powerLists.powerOpenId': ctx.data.openId
   }).get().then(res => {
     ctx.data.msg = 'success'
     ctx.data.data = res.data[0]
     ctx.body = {
      data: ctx.data
    }
   })
    
    await next()
  })

  // 获取当前用户下的全部权限信息
  app.router('getAllPowerLists', async (ctx, next) => {

    let total = 0
    let result = await db.collection('relative').where({
      desc: 'power'
    }).count()

    total = result.total

    ctx.data.total = total

    await db.collection('relative').where({
      desc: 'power',
      mainOne: ctx.data.openId
    }).get().then(res => {
      ctx.data.data = res.data
    })

    ctx.body = {
      data: ctx.data
    }
    await next()
  })

  // 更改指定共享人权限
  app.router('changePowerListsOnlyRead', async (ctx, next) => {
    let id = ''
    let onlyRead = ''
    await db.collection('relative').where({
      desc: 'power',
      mainOne: ctx.data.openId
    }).get().then(res => {
      res.data[0].powerLists.forEach((value, index) => {
        if (event.powerOpenId === value.powerOpenId) {
          ctx.data.data = value
          onlyRead = value.onlyRead
          ctx.data.msg = 'success'
          ctx.data.code = 200
          ctx.data.index = index
        }
      })
      id = res.data[0]._id
    })


    if (ctx.data.code == 200 && id) {
      await db.collection('relative').where({
        desc: 'power',
        mainOne: ctx.data.openId,
        powerLists: {
          powerOpenId: event.powerOpenId
        }
      }).update({
        data: {
          'powerLists.$.onlyRead': onlyRead === 'true' ? 'false' : 'true',
          'powerLists.$.readAndWrite': onlyRead === 'true' ? 'true' : 'false'
        }
      }).then(res => {
        ctx.data.msg = 'success'
        ctx.data.code = '250'
        ctx.body = {
          data: ctx.data
        }
      })
    }
    await next()
  })



  // 添加手机联系人
  app.router('addContact', async (ctx, next) => {
    await db.collection('contacts').where({
      displayName: event.displayName,
      openId: event.openId
    }).get().then(res => {
      if(res.data.length != 0) {
        ctx.data.code = 230
      }
    })
    if (ctx.data.code != 230) {
      await db.collection('contacts').add({
        data: {
          displayName: event.displayName,
          phoneNumber: event.phoneNumber,
          firstLetter: event.firstLetter,
          openId: ctx.data.openId
        }
      }).then(res => {
        ctx.data.data = res.data
        ctx.data.code = 200
        ctx.data.msg = 'success'
        ctx.body = {
          data: ctx.data
        }
      })
      return
    }

    ctx.body = {
      data: ctx.data
    }
    await next()
  })


  // 获取手机联系人
  app.router('getContacts', async (ctx, next) => {
    //当前用户下的记录总数
    let total = 0
    //每一次获取的记录数量
    let MAX_LIMIT = event.max_limit
    //需要分几次查询
    let batchTimes = 0

    // 获取当前用户下的记录总数
    const result = await db.collection('contacts').where({
      openId: ctx.data.openId
    }).count()
    total = result.total

    // 通过总记录数与每次获取的记录数计算出需要分几次取
    batchTimes = Math.ceil(total / MAX_LIMIT)

    // 获取到指定条件下的指定数量记录返回给小程序端
    await db.collection('contacts').where({
      openId: ctx.data.openId
    }).skip(event.start * MAX_LIMIT).limit(MAX_LIMIT).get().then(res => {
        ctx.data.data = res.data,
        ctx.data.batchTimes = batchTimes,
        ctx.data.msg = 'success',
        ctx.data.code = 200
      }).catch(e => {
        ctx.data.msg = 'fail',
        ctx.data.code = 520
    })
    ctx.body = {
      data: ctx.data
    }
    await next()
  })

  return app.serve()
}