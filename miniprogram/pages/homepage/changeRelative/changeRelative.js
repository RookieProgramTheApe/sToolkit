// pages/homepage/changeRelative/changeRelative.js
import Notify from '../../../miniprogram_npm/@vant/weapp/notify/notify'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: '',
    active: 0,
    relativeName: '',
    relativeMoney: '',
    btnText:'开始修改',
    steps: [
      {
        text: '步骤一',
        desc: '开始修改',
      },
      {
        text: '步骤二',
        desc: '修改姓名',
      },
      {
        text: '步骤三',
        desc: '修改金额',
      },
      {
        text: '步骤四',
        desc: '完成修改',
      },
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu({
      menus: ['shareAppMessage', 'shareTimeline']
    })
    this.setData({
      id: options.id
    })

    wx.cloud.callFunction({
      name: 'cloudMethods',
      data: {
        $url: 'getRelativeInfoById',
        id: this.data.id
      }
    }).then(res => {
      if (res.result.data.code != 200) {
        Notify({ type: 'danger', message: '获取随礼人信息失败，请重试' })
        return
      }
      this.setData({
        relativeName: res.result.data.data.name,
        relativeMoney: res.result.data.data.money
      })
    })
  },

  clickStep() {
    let active = this.data.active
    active = active > 3 ? 0 : active + 1
    this.setData({
      active: active
    })

    if (active == 2) {
      if (this.data.relativeName == '') {
        Notify({ type: 'warning', message: '姓名都改没了你还能知道是谁嘛~' })
        active = this.data.active - 1
        this.setData({ active: active })
        return
      }
    }

    if (active == 3) {
      if (this.data.relativeMoney - 0 < 1 || this.data.relativeMoney == '-' || this.data.relativeMoney == '+') {
        Notify({ type: 'warning', message: '随礼金额可不能乱改哦~' })
        active = this.data.active - 1
        this.setData({ active: active })
        return
      }
      wx.cloud.callFunction({
        name: 'cloudMethods',
        data: {
          $url: 'changeRelativeById',
          id: this.data.id,
          relativeName: this.data.relativeName,
          relativeMoney: this.data.relativeMoney
        }
      }).then(res => {
        this.setData({
          btnText: '修改成功'
        })
        wx.navigateBack({
          delta: 5,
        })
      })
     
      return
    }
    this.setData({
      btnText: '下一步'
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})