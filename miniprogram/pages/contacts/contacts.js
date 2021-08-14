// miniprogram/pages/contacts/contacts.js
import  pinyin from "wl-pinyin"
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    indexList:[],
    openId: '',
    start: 0,
    contactLists: [],
    showView: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({ openId: wx.getStorageSync('openId') })
    wx.hideShareMenu({
      menus: ['shareAppMessage', 'shareTimeline']
    })

    this.getContacts()

  },

  getContacts() {
    wx.showLoading({
      title: '加载中...',
    })
    wx.cloud.callFunction({
      name: 'cloudMethods',
      data: {
        $url: 'getContacts',
        start: this.data.start,
        max_limit: 16
      }
    }).then(res => {
      // 通过后端状态码判断是否正常返回数据
      if (res.result.data.code == 200) {
        let tempFirstLetter = []
        let tempContactLists = []
        let result = res.result.data.data

        // 拿到后端数据并做去重和排序处理
        result.forEach(element => { tempFirstLetter.push(element.firstLetter) })
        tempFirstLetter = [...new Set(tempFirstLetter)]
        tempFirstLetter.sort()

        // 按姓名首字母拼音分组
        tempFirstLetter.forEach(element => {
          // 通过过滤数组放回符合条件的数据项
          let assignElement = result.filter(item => {
            return item.firstLetter == element; 
          })
          // 将处理后的数据添加到新的对象数组中
          tempContactLists.push({ index: element, data: assignElement })
        })

        let tempLists = []
        let tempFirstLetterLists = []
        if (this.data.contactLists.length != 0) {
          tempFirstLetterLists = this.data.indexList
          tempLists = this.data.contactLists
          tempContactLists.forEach(value => {
            tempLists.push(value)
          })
          tempFirstLetter.forEach(value => {
            tempFirstLetterLists.push(value)
          })
        }else {
          tempLists = tempContactLists
          tempFirstLetterLists = tempFirstLetter
        }
        
        wx.hideLoading({})
        this.setData({ 
          contactLists: tempLists,
          indexList: tempFirstLetterLists,
          batchTimes: res.result.data.batchTimes
        })
      }
    })
  },


  // 拨打电话
  callPhoneEvent(e) {
    wx.makePhoneCall({
      phoneNumber: e.currentTarget.dataset.phonenumber
    })
  },

  addEvent(e) {
    let displayName = e.currentTarget.dataset.displayname
    let phoneNumber = e.currentTarget.dataset.phonenumber

    wx.addPhoneContact({
      firstName: displayName,
      mobilePhoneNumber: phoneNumber
    })
  },

  // 添加联系人
  addContact() {
    wx.chooseContact({
      success: res => {
        if (res.displayName && res.phoneNumber) {
          this.wxAddContact(res.displayName, res.phoneNumber)
          this.setData({ indexList: [], contactLists: [], start: 0 })
          this.getContacts()
          return
        }
      }
    })
  },

  // 调用“新增联系人”云函数
  wxAddContact(displayName, phoneNumber) {
    wx.cloud.callFunction({
      name: 'cloudMethods',
      data: {
        $url: 'addContact',
        displayName: displayName,
        phoneNumber: phoneNumber,
        firstLetter: pinyin.getFirstLetter(displayName).substr(0, 1),
        openId: this.data.openId
      }
    }).then(res => {
      console.log(res)
      if (res.result.data.code == 200) {
        wx.showToast({
          title: '添加成功~',
        })
        return
      }else if (res.result.data.code == 230) {
          wx.showToast({
            title: '联系人已存在',
            duration: 3000
          })
      }
      
    })
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
    this.setData({ showView: true })
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
      this.setData({ showView: true })
      var tempStart = this.data.start + 1
      this.setData({ start: tempStart })
      this.getContacts()
      return
    }

    this.setData({ showView: true })

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (e) {
    console.log(e)
    return {
      title: '你的好友给你分享了一个联系人，点击查看~',
      path: `pages/contacts/share/share?contactDetail=${e.target.dataset.detail}`
    }
  }
})