const main = () => {
  /**************************
   * スプレッドシートの情報を取得
   **************************/
  const getSpreadsheetDatas = () => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('【GAS】Slackチャンネル作成自動化');
    // 配列でセルデータの取得 [[Slackのチャンネル名,メールアドレス複数]]
    const rowDatas = sheet.getRange(2,1, sheet.getLastRow()-1,sheet.getLastColumn()).getValues();

    // [{ channelName: "", mail: [] }]で情報を分ける
    let SpreadsheetInfo = [];
    rowDatas.map((array,index)=>{
      SpreadsheetInfo.push({ channelName: "", mail: [] })
      array.map((v,i)=>{
        if(i == 0){
          SpreadsheetInfo[index].channelName = v;
          return;
        }
        SpreadsheetInfo[index].mail.push(v);
      })
    })
    return SpreadsheetInfo;
  }

  /**************************
   * メールを元にユーザーIDを取得
   **************************/
  const getUserID = (email) => {
    // APIのURL
    const url = "https://slack.com/api/users.lookupByEmail"  
    let payload = {
      "token": "xoxp-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "email": email
    }

    let options = {
      "method": "GET",
      "payload": payload,
      "headers": {
        "contentType": "x-www-form-urlencoded",
      }
    }

    let jsonData = UrlFetchApp.fetch(url, options);
    jsonData = JSON.parse(jsonData);

    // JSONデータが格納されているか？
    if(jsonData["ok"]) {
      let userID = String(jsonData.user.id);
      return userID;
    }else{
      return "name";
    }
  }

  /**************************
   * Slackのチャンネル作成
   **************************/
  const createSlackChannel = (channelName) => {
    const url = "https://slack.com/api/conversations.create";
    const options = {
      "method" : "POST",
      "contentType": "application/x-www-form-urlencoded",
      "payload" : { 
        "token": "xoxp-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "name": channelName,
              "is_private": true
      }
    };  
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    // チャンネルIDの取得
    return json.channel.id
  }

  /**************************
   * Slackのチャンネルに招待
   **************************/
  const inviteSlackUser = (userId) => {
    const url = "https://slack.com/api/conversations.invite";
    const options = {
      "method": "POST",
      "contentType": "application/x-www-form-urlencoded",
      "payload" : { 
        "token": "xoxp-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "users": userId
      }
    }

    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
  }


  /**************************
   * メインロジック
   **************************/
  const spreadsheetDatesArray = getSpreadsheetDatas();
  spreadsheetDatesArray.map((obj)=>{
    // Skackのチャンネル作成
    let ChannelID = createSlackChannel(obj.channelName);
    // メールアドレスを元にユーザー情報を取得
    let userIDList = obj.mail.map((v) => getUserID(v));
    // チャンネルにユーザを追加
    userIDList.map((userID)=> inviteSlackUser(ChannelID, userID))
  })
}
