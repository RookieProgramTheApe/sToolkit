// miniprogram/pages/homepage.js
import Notify from '../../miniprogram_npm/@vant/weapp/notify/notify'
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'

// 引入微信同声传译插件
const plugin = requirePlugin("WechatSI")
const innerAudioContext = wx.createInnerAudioContext()


Page({

  /**
   * 页面的初始数据
   */
  data: {
    calendarLoading: false,
    showInputBarPopup:false,
    showCalendar: true,
    today: { year:'', month: '', day: '' },
    activeNames: ['1'],
    relativeLists: [],
    relativelistsLength: 0,
    batchTimes: 0,
    start: 0,
    searchDataLists: [],
    show: false,
    showAddBtn: false,
    inputValue: '',
    empty: false,
    searchDataListsLength: 0,
    loadingFlag: false,
    countFlag: false,
    totalMoney: 0,
    openId: '',
    lunarCalendarData: null,
    notCode: true,
    shareName: '',
    onlyReadChecked: true,
    readAndWriteChecked: false,
    powerLists: {
      onlyRead: 'false'
    },
    btnNumberFlag: 1,
    relativeName:'',
    relativeMoney:'',
    addBtnLoading: false,
    powerTableLists:[],
    shareBtn: false, 
    powerBtn: false, 
    listBtn: false
  },

  playRelativeDetail(e) {
    plugin.textToSpeech({
      lang: "zh_CN",
      tts: true,
      content: e.currentTarget.dataset.sound,
      success: function(res) {
          innerAudioContext.autoplay = true
          innerAudioContext.src = res.filename
      }
    })
  },

  onChange(event) {
    this.setData({
      activeNames: event.detail,
    });
  },

  init(){
    this.setData({ loadingFlag: false, countFlag: false, showCalendar: true, calendarLoading: false })
    wx.hideShareMenu({ menus: ['shareTimeline'] })
    this.getLunarCalendar()
  },



  // 新增、分享、权限、列表按钮点击事件，通过id值区分用户所点击的按钮
  btnClickEvent(e) {
    let id = e.currentTarget.dataset.id - 0
    switch (id) {
      case 1: this.setData({ btnNumberFlag: id }); break
      case 2: this.setData({ btnNumberFlag: id }); break
      case 3: this.setData({ btnNumberFlag: id }); break
      case 4: this.setData({ btnNumberFlag: id }); this.getPowerLists(); break
    }
  },

  // “新增随礼人”按钮点击事件
  clickNewRelativeBtn() {
    const relativeName = this.data.relativeName
    const relativeMoney = this.data.relativeMoney


    // 判断用户是否正确输入内容
    if (relativeName && relativeMoney && relativeMoney - 0 > 0) {
      // 调用云函数新增用户输入的随礼人信息
      this.setData({ addBtnLoading: true })
      this.callCloudAddNewRelative(relativeName, relativeMoney)
      return
    }else if (relativeName === '') {
      Notify({ type: 'warning', message: '随礼人姓名不能为空哦~' })
      return
    } else if (relativeMoney - 0 < 1) {
      Notify({ type: 'warning', message: '随礼金额好像不太对哦~' })
      return
    }
    // 提示用户正确输入
    Notify({ type: 'warning', message: '请保证姓名或金额不为空后再提交' })
  },

  callCloudAddNewRelative(relativeName, relativeMoney) {
    wx.cloud.callFunction({
      name: 'cloudMethods',
      data: {
        $url: 'addNewRelative',
        relativeName: relativeName,
        relativeMoney: relativeMoney,
        openId: this.data.openId
      }
    }).then(res => {
      this.setData({ addBtnLoading: false })
      // 判断是否添加重复随礼人
      if (res.result.data.code == 230) {
        Notify({ type: 'primary ', message: '系统中已存在此随礼人，请勿重复添加哦~' })
        return
      }

      // 判断是否执行添加失败
      if (res.result.data.code != 200 && res.result.data.code != 230) {
        Notify({ type: 'danger', message: '新增随礼人失败，请重试' })
        return
      }

      // 成功添加随礼人
      Notify({ type: 'success', message: '新增随礼人成功~' })
      this.setData({
        relativeName: '',
        relativeMoney: ''
      })
      if (!this.data.onLoadFlag) {
        let tempRelativeLists = []
        this.setData({
          start: 0,
          show: false,
          countFlag: false,
          relativeLists: tempRelativeLists,
          inputValue: '',
          showCalendar: true,
          showInputBarPopup: false
        })
        this.getRelativeLists()
      }
      this.setData({ onLoadFlag: false })
      this.getLunarCalendar()
    }).catch(e => {
      
    })
  }, 


  addEvent() {
    wx.cloud.callFunction({
      name:'cloudMethods',
      data: {
        $url: 'addShareOne'
      }
    }).then(res => {
      console.log(res)
    })
  },
  

  // 获取所有权限人列表信息
  getPowerLists() {
    wx.cloud.callFunction({
      name: 'cloudMethods',
      data: {
        $url: 'getAllPowerLists'
      }
    }).then(res => {
      if (!res.result.data.data.length && res.result.data.total != 0) {
        this.setData({ shareBtn: true, powerBtn: true, listBtn: true })
        return
      }
      
      this.setData({ shareBtn: false, powerBtn: false, listBtn: false })
      this.setData({ powerTableLists: res.result.data.data[0].powerLists })
    })
  },

  upateOnlyRead(e) {
    let powerOpenId = e.currentTarget.dataset.poweropenid
    // 自定义加载图标
    Toast.loading({
      message: '更改中...',
      forbidClick: true,
      loadingType: 'spinner',
    })
    wx.vibrateShort()
    wx.cloud.callFunction({
      name: 'cloudMethods',
      data: {
        $url: 'changePowerListsOnlyRead',
        powerOpenId: powerOpenId
      }
    }).then(res => {
      this.getPowerLists()
      Toast.clear()
    })
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.init()
    this.getPowerLists()
    this.setData({ onLoadFlag: true })
    this.getRelativeLists(options)
  },

  // 获取今日农历信息
  getLunarCalendar () {
    this.setData({ calendarLoading: true  })
    wx.cloud.callFunction({
      name: 'cloudMethods',
      data: {
        $url: 'getLunarCalendar'
      }
    }).then(res => {
      if (res.result.data.code === 200) {
        this.setData({ lunarCalendarData: res.result.data.data[0], calendarLoading: false })
        let tempTime = this.data.lunarCalendarData.yangli
        this.setData({ 
          today: {
            year: tempTime.substr(0,4),
            month: tempTime.substr(5,2),
            day: tempTime.substr(8,2)
          }
         })
        return
      }
      this.setData({
        lunarCalendarData: null
      })
    })
  },

  // 通过邀请码同步数据
  getInvitationCode (options) {
    if (options)
    if (options.openId && options.shareName != '') {
      let powerObj = {
        shareName: options.shareName,
        powerOpenId: this.data.openId,
        onlyRead: options.onlyReadChecked,
        readAndWrite: options.readAndWriteChecked
      }

      wx.cloud.callFunction({
        name: 'cloudMethods',
        data: {
          $url: 'addOpenIdByInvitationCode',
          oldOpenId: options.openId
        }
      }).then(res => {
        if (res.result.data.code === 230) {
          // 添加共享人
          wx.cloud.callFunction({
            name: 'cloudMethods',
            data: {
              $url: 'addShareOne',
              openId: options.openId,
              powerList: powerObj
            }
          }).then(res => {
            this.getPowerLists()
                // 获取当前用户下的权限
            wx.cloud.callFunction({
              name: 'cloudMethods',
              data: {
                $url: 'getPowerByOpenId'
              }
            }).then(res => {
              if (res.result.data.data) {
                res.result.data.data.powerLists.forEach(value => {
                  if (value.powerOpenId == this.data.openId) {
                    this.setData({ powerLists: value })
                  }
                })
              }
            })

          })
          Notify({ type: 'warning', message: '你已加入，无需重复加入~' })
          return
        }else if (res.result.data.code === 200) {
          Notify({ type: 'success', message: '通过邀请码加入成功~' })
          this.getRelativeLists()

          // 添加共享人
          wx.cloud.callFunction({
            name: 'cloudMethods',
            data: {
              $url: 'addShareOne',
              openId: options.openId,
              powerList: powerObj
            }
          }).then(res => {
            this.getPowerLists()
            // 获取当前用户下的权限
            wx.cloud.callFunction({
              name: 'cloudMethods',
              data: {
                $url: 'getPowerByOpenId'
              }
            }).then(res => {
              if (res.result.data.data) {
                res.result.data.data.powerLists.forEach(value => {
                  if (value.powerOpenId == this.data.openId) {
                    this.setData({ powerLists: value })
                  }
                })
              }
            })
            return
          }).catch(e => {
            Notify({ type: 'danger', message: '通过邀请码加入失败~' })
          })
        }

        
      })
    }

     // 获取当前用户下的权限
     wx.cloud.callFunction({
      name: 'cloudMethods',
      data: {
        $url: 'getPowerByOpenId'
      }
    }).then(res => {
      if (res.result.data.data) {
        res.result.data.data.powerLists.forEach(value => {
          if (value.powerOpenId == this.data.openId) {
            this.setData({ powerLists: value })
          }
        })
      }
    })
  },

  focusSearchBar() {
    this.setData({
      showInputBarPopup: true
    })
  },

  onAddbtnClose() {
    this.setData({showAddBtn: false})
  },

  test() {
    this.setData({ showAddBtn: true })
  },

  onClose() {
    this.setData({ showInputBarPopup: false, show: false, showCalendar: true, inputValue: '' })
    wx.hideKeyboard()
  },

  // 搜索栏内容发生改变事件
  inputSearchEvent(e) {
    if (e.detail == '') {
      this.setData({ show: false, showCalendar: true, showInputBarPopup: false})
      wx.hideKeyboard()
      return
    }
    this.setData({ show: true, showCalendar: false })

    const db = wx.cloud.database()
    db.collection('relative').where({
      //使用正则查询，实现对搜索的模糊查询
      openId: this.data.relativeLists[0].openId[0],
      name: db.RegExp({
        //从搜索栏中获取的detail作为规则进行匹配
        regexp: e.detail,
        //大小写不区分
        options: 'i'
      })
    }).get().then(res => {
      let tempSearchDataLists = []
      tempSearchDataLists = res.data
      if (tempSearchDataLists.length == 0) {
        tempSearchDataLists.push({ name: '未找到相关随礼人信息哦~', value: '', _id: '' })
        this.setData({ empty: true, searchDataLists: tempSearchDataLists })
        return
      }
      this.setData({searchDataLists: tempSearchDataLists, empty: false, searchDataListsLength: tempSearchDataLists.length })
    })
  },

  // 获取随礼人信息
  getRelativeLists(options) {
    this.setData({ loadingFlag: true })
    wx.cloud.callFunction({
      name: 'cloudMethods',
      data: {
        $url: 'getRelativeLists',
        start: this.data.start,
        max_limit: 16
      }
    }).then(res => {
        // 拿到云函数执行结果
        const result = res.result.data
        // 判断云函数是否执行成功
        if (result.code != 200) {
          return
        }

        if (this.data.notCode) {
          // 新建一个临时数组，用于存储已获取的的数据
          let tempRelativeLists = this.data.relativeLists
          // 通过循环遍历将新数据与上一次的数据合并
          result.data.forEach((value) => {
            tempRelativeLists.push(value)
          })
          // 将合并后的数据传递给原数组，并将分页次数存储起来
          this.setData({
            openId: result.openId,
            relativeLists: tempRelativeLists,
            batchTimes: result.batchTimes,
            loadingFlag: false
          })

          // 将openId缓存起来，方便其它tabbar页面使用
          wx.setStorageSync('openId', result.openId)
        }
      this.getInvitationCode(options)
    })
  },


  // 更改指定随礼人按钮点击事件
  changeRelative (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: './changeRelative/changeRelative?id='+id,
    })
  },

  // 删除指定随礼人按钮点击事件
  deleteRelative (e){
    const _that = this
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '你是否确认删除该随礼人？',
      success (res) {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'cloudMethods',
            data: {
              $url: 'deleteRelativeById',
              id: id
            }
          }).then(res => {
            if (res.result.data.code != 200) {
              Notify({ type: 'danger', message: '删除随礼人失败，请重试' })
              return
            }
            Notify({ type: 'success', message: '删除随礼人成功~' })
            let tempRelativeLists = []
            _that.setData({
              start: 0,
              show: false,
              relativeLists: tempRelativeLists,
              inputValue: ''
            })
            _that.getRelativeLists()
          })
        }
      }
    })
  },

  onOnlyReadCheckedChange(detail) {
    this.setData({ onlyReadChecked: !this.data.onlyReadChecked, readAndWriteChecked: !this.data.readAndWriteChecked })
  },

  onReadAndWriteCheckedChange(detail) {
    this.setData({ readAndWriteChecked: !this.data.readAndWriteChecked, onlyReadChecked: !this.data.onlyReadChecked })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (!this.data.onLoadFlag) {
      let tempRelativeLists = []
      this.setData({
        start: 0,
        show: false,
        countFlag: false,
        relativeLists: tempRelativeLists,
        inputValue: '',
        showCalendar: true,
        showInputBarPopup: false
      })
      this.getRelativeLists()
    }
    this.setData({ onLoadFlag: false })
    this.getLunarCalendar()
    this.getPowerLists()

     // 获取当前用户下的权限
     wx.cloud.callFunction({
      name: 'cloudMethods',
      data: {
        $url: 'getPowerByOpenId'
      }
    }).then(res => {
      if (res.result.data.data) {
        res.result.data.data.powerLists.forEach(value => {
          if (value.powerOpenId == this.data.openId) {
            this.setData({ powerLists: value })
          }
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.start < this.data.batchTimes) {
      var tempStart = this.data.start + 1
      this.setData({ start: tempStart })
      this.getRelativeLists()
    }

    // 当数据全部显示完成后
    if (this.data.start >= this.data.batchTimes) {
      // 显示总随礼人数
      const length = this.data.relativeLists.length
      this.setData({ countFlag: true, relativelistsLength: length})
      this.getAllRelativeMoney()
    }
  },

  getAllRelativeMoney() {
    wx.cloud.callFunction({
      name: 'cloudMethods',
      data: {
        $url: 'getAllRelativeMoney',
        max_limit: 50
      }
    }).then(res => {
      const {result: totalMoney } = res
      this.setData({ totalMoney: totalMoney.totalMoney })
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage () {
    return {
      title: '点击小程序，和我一起使用随礼薄吧~',
      path: `pages/homepage/homepage?openId=${this.data.openId}&shareName=${this.data.shareName}&onlyReadChecked=${this.data.onlyReadChecked}&readAndWriteChecked=${this.data.readAndWriteChecked}`
    }
  }
})