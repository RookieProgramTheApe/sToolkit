// pages/homepage/relativeDetail/relativeDetail.js
import Notify from '../../../miniprogram_npm/@vant/weapp/notify/notify'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputRelativeName:'',
    inputRelativeMoney:'',
    circleWidth:0,
    relativeDetailObj: {
      relativeName: '',
      relativeMoney: 0,
      id: '',
      amount: 0,
      changeCount: 0,
      returnSaluteObj:[]
    },
    leftColor: {
      '0%': '#ffb74d',
      '50%': '#ff5722',
      '100%': '#ee0a24'
    },
    rightColor: {
      '0%': '#40E8FF',
      '100%': '#614AF6'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    wx.hideShareMenu({
      menus: ['shareAppMessage', 'shareTimeline']
    })

    // 获取手机屏幕宽度
    this.setData({
      id: options.id,
      circleWidth: wx.getSystemInfoSync().windowWidth / 2 - 20
    })

   this.getRelativeInfoById()
  },

  getRelativeInfoById() {
    wx.cloud.callFunction({
      name:'cloudMethods',
      data: {
        $url: 'getRelativeInfoById',
        id: this.data.id
      }
    }).then(res => {
      const { result: data} = res
      const result = data.data.data
      this.setData({
        relativeDetailObj:{
          relativeName: result.name,
          relativeMoney: result.money,
          id: this.data.id,
          amount: result.amount,
          changeCount: result.returnSaluteObj.length,
          returnSaluteObj: result.returnSaluteObj
        }
      })

      let tempArr = this.data.relativeDetailObj.returnSaluteObj
      let expendMoney = 0
      tempArr.forEach((value) => {
        expendMoney += value.money - 0
      })

      
      let tempCalc = expendMoney === 0 ? 1 : expendMoney / 100
      let leftCircle = expendMoney === 0 ? 0 : 100
      let rightCircle = Math.ceil(this.data.relativeDetailObj.relativeMoney / tempCalc)

      
      this.setData({ expendMoney: expendMoney, leftCircleValue: leftCircle, rightCircleValue: rightCircle })
    })
  },

  addReturnASaluteEvent() {
    if (this.data.inputRelativeName == '' || this.data.inputRelativeMoney == '') {
      Notify({ type: 'warning', message: '回礼名称或金额不能为空哦~' })
      return
    }else if (this.data.inputRelativeMoney - 0 < 1) {
      Notify({ type: 'warning', message: '回礼金额这么少的吗~' })
      return
    }

    wx.cloud.callFunction({
      name: 'cloudMethods',
      data: {
        $url: 'addReturnASalute',
        id: this.data.relativeDetailObj.id,
        returnSalute: {
          name: this.data.inputRelativeName,
          money: this.data.inputRelativeMoney
        }
      }
    }).then(res => {
      // 如果云函数执行不成功
      if (res.result.data.code != 200) {
        return
      }
      this.getRelativeInfoById()
      this.setData({ inputRelativeName: '', inputRelativeMoney: '' })
    })
  },

  // 左滑删除回礼
  clickDeleteByIdEvent(e) {
    wx.showModal({
      title: '确认删除',
      content: '你是否确认删除该回礼记录？'
    }).then(res => {
      if (res.confirm) {
        let number = e.currentTarget.dataset.id

        wx.cloud.callFunction({
          name: 'cloudMethods',
          data: {
            $url: 'deleteReturnASalute',
            id: this.data.id,
            number: number
          }
        }).then(res => {
          this.getRelativeInfoById()
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