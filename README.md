

<a name="hvnnT"></a>
## 文档
该小程序主要有两个功能，一个是电子随礼薄，一个是云通讯录，电子随礼薄比起传统的纸质更有优势，包括支持更改、模糊搜索、可备注每次回礼的名称及礼金、	考虑到实际使用情况，也做了分享功能，可实现一个编辑多人查看，并具有简单的权限管理，防止分享出去的随礼人信息被其他人更改，对于老人也做了考虑，可以点击语音播报功能了解相关随礼情况，通讯录支持从手机导入，复制、分享联系人信息，一键拨号等等，出于信息安全考虑，通讯录未做分享功能。<br />​



    
## 所用组件库及框架
  ##### 小程序组件库使用的是有赞前端团队开源的微信小程序端组件库Vant Weapp
- [vant Weapp](https://vant-contrib.gitee.io/vant-weapp/#/home)
- 
  ##### 小程序云通讯录功能代码中使用的汉字转拼音使用的是wl-pinyin插件完成，在用户导入联系人时提取出首字母后保存进数据库，这是为了实现后续联系人显示时按首字母拼音显示，与手机通讯录类似。
- [wl-pinyin](https://www.npmjs.com/package/wl-pinyin)
- 
  ##### 小程序后端代码中使用的路由管理框架是云开发官方发布的tcb-router，与koa类似，后端采用Node.js编写。
- [tcb-Router](https://github.com/TencentCloudBase/tcb-router)


## 参考文档

- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

