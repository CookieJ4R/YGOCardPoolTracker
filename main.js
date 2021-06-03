const {app, BrowserWindow, ipcMain} = require('electron');
var request = require('request');
const Datastore = require('nedb'), db = new Datastore({filename: 'cards', autoload: true});

var mainWindow;

function createWindow(){

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        autoHideMenuBar: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        }
    })

    mainWindow.loadFile('index.html')
    //mainWindow.setMenu(null);
    mainWindow.show();

}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin'){
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0){
        createWindow()
    }
})

ipcMain.on('appAction', (event, arg) => {
    switch(arg){
        case "exit":
            app.quit();
            break;
        case "back":
            mainWindow.loadFile('index.html');
            break;
    }
})

ipcMain.on("importData", (event, args) => {
    getCards(args);
})

ipcMain.on("searchQuery", (event, query) => {
    console.log(query);
    let queryObject = getObjFromQuery(query);
    if(queryObject != null){
        console.log("QueryObject: " + queryObject);
            db.find(queryObject, function(err, docs){
                console.log(err);
                mainWindow.webContents.send('queryResult', docs);
            })
    }
    else 
    console.log("obj is null");
})

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCards(args){
    mainWindow.webContents.send("importRunning", true);
    var cardList = args.split('\n');
    for(var i = 0; i < cardList.length; i++){
        var curCardId = cardList[i];
        console.log(curCardId[i] + " should Search: " + !(curCardId.trim().startsWith('!')||curCardId.trim().startsWith('#') || curCardId.trim() == ""));
        if(!(curCardId.trim().startsWith('!')||curCardId.trim().startsWith('#')||curCardId.trim()=="")){
            //Card ID muss gesucht und gecached werden
            console.log("Looking up: " + curCardId);
            request('https://db.ygoprodeck.com/api/v7/cardinfo.php?id=' + curCardId, function (error, response, body) {
                console.log("Found Card: " + body);
                cardObj = JSON.parse(body);
                var doc = {
                    passcode: cardObj.data[0].id,
                    cardtype: cardObj.data[0].type,
                    name: cardObj.data[0].name,
                    desc: cardObj.data[0].desc,
                    atk: cardObj.data[0].atk,
                    def: cardObj.data[0].def,
                    level: cardObj.data[0].level,
                    race: cardObj.data[0].race,
                    attribute: cardObj.data[0].attribute,
                    archetype: cardObj.data[0].archetype,
                    scale: cardObj.data[0].scale,
                    linkval: cardObj.data[0].linkval, 
                    linkmarkers: cardObj.data[0].linkmarkers,
                    amount: 1
                }
                console.log(doc.passcode);
                console.log(doc.cardtype);
                console.log(doc.name);
                console.log(doc.desc);
                console.log(doc.atk);
                console.log(doc.def);
                console.log(doc.level);
                console.log(doc.race);
                console.log(doc.attribute);
                console.log(doc.archetype);
                console.log(doc.scale);
                console.log(doc.linkval);
                console.log(doc.linkmarkers);
                console.log(doc.amount);
                db.count({passcode: cardObj.data[0].id}, function(err, count) {
                    if(count != 0)
                    db.find({passcode: cardObj.data[0].id}, function (err, docs){
                        let tempAmount = docs[0].amount + 1 > 3 ? 3 : docs[0].amount + 1;
                        db.update({passcode: cardObj.data[0].id,}, {$set: {amount: tempAmount}})
                    })
                    else
                    db.insert(doc);
                })
            }
            )
            await sleep(100);
        }
    }
    //Finished DropFeld freigeben
    mainWindow.webContents.send("importRunning", false);
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

function getObjFromQuery(queryString){

    queryString = queryString.trim().toLowerCase();

    let queries = [];

    queries = queryString.split(new RegExp("&&"));

    let returnObj = {};

    console.log(queries);
    queries.forEach(element => {
        element = element.trim();
        let regExp = new RegExp("[<>!]?=|[<>]");
        let operator = element.match(regExp);
        if(operator == null) return null;
        operator = operator[0];
        console.log(operator);
        let sides = [];
        sides = element.split(regExp, 2);
        let left = sides[0].trim();
        let right = sides[1].trim();
        console.log(left);
        console.log(right);
        switch(left){
            case "passcode":
                returnObj.passcode = right;
                break;
            case "name":
                console.log("setting name");
                returnObj.name = new RegExp(".*" + escapeRegExp(right) + ".*", "i");
                console.log(returnObj.name);
                break;
            case "desc":
                returnObj.desc = new RegExp(".*" + escapeRegExp(right) + ".*", "i");
                break;
            case "atk":
                returnObj.atk = getQueryWithOperator(operator, right);
                break;
            case "def":
                returnObj.def = getQueryWithOperator(operator, right);
                break;
            case "level":
                returnObj.level = getQueryWithOperator(operator, right);
                break;
            case "cardtype":
                returnObj.cardtype = new RegExp(escapeRegExp(right), "i");
                break;
            case "type":
                returnObj.race = new RegExp(escapeRegExp(right), "i");
                break;
            case "attribute":
                returnObj.attribute = new RegExp(escapeRegExp(right), "i");
                break;
            case "archetype":
                returnObj.archetype = new RegExp(escapeRegExp(right), "i");
                break;
        }
    });
    return returnObj;

}

function getQueryWithOperator(operator, query){
    switch(operator){
        case "<=":
            return {$lte: parseInt(query)};
        case "<":
            return {$lt: parseInt(query)};
        case ">=":
            return {$gte: parseInt(query)};
        case ">":
            return {$gt: parseInt(query)};
        case "!=":
            return {$ne: parseInt(query)};
        case "=":
            return parseInt(query);
    }
}

