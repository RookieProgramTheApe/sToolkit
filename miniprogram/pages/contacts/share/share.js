// pages/contacts/share/share.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  // 拨打电话
  callPhoneEvent(e) {
    wx.makePhoneCall({
      phoneNumber: e.currentTarget.dataset.phonenumber
    })
  },

  // 添加联系人到手机
  addEvent(e) {
    let displayName = e.currentTarget.dataset.displayname
    let phoneNumber = e.currentTarget.dataset.phonenumber

    wx.addPhoneContact({
      firstName: displayName,
      mobilePhoneNumber: phoneNumber
    })
  },

  setClipBoardDataEvent(e) {
    let displayName = e.currentTarget.dataset.displayname
    let phoneNumber = e.currentTarget.dataset.phonenumber

    wx.setClipboardData({
      data: `     姓名：${displayName}
      电话：${phoneNumber}`,
    })
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let name = options.contactDetail.split('~')[0]
    let phoneNumber = options.contactDetail.split('~')[1]

    this.setData({
      displayName: name,
      phoneNumber: phoneNumber
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