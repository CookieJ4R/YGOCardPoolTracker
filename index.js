const {ipcRenderer} = require('electron');

var importRunning = false;


window.onload=function(){

document.getElementById('importArea').addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if(importRunning)return;
    if(event.dataTransfer.files.length > 1){
        document.getElementById('importAreaStatusText').style.color = "#EA4193"
        document.getElementById('importAreaStatusText').innerHTML = "Please only drop one .ydk-file at the same time!"
        return;
    }
    for(const f of event.dataTransfer.files){
        sendIDsToMain(f)
        return;
    }
});

  document.getElementById('importArea').addEventListener('dragover', (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
  }); 
  
}


async function sendIDsToMain(f){
    var text = await f.text();
    ipcRenderer.send("importData", text);
}

function test(){
    ipcRenderer.send("searchQuery", document.getElementById('searchBar').value);
}

ipcRenderer.on('queryResult', function(event, docs){
    document.getElementById('headline').innerHTML += '<span class="material-icons" style="-webkit-app-region: no-drag;color: white;user-select: none;" onclick="back()">arrow_back</span>'
    console.log(docs.length);
    document.getElementById('content').innerHTML = "";
    docs.forEach(doc => {    
        document.getElementById('content').innerHTML += buildHTML(doc);       
    })
})

function buildHTML(doc){
    switch(doc.cardtype.toLowerCase()){
        case "spell card":
        case "trap card":
        let htmlST = "<div style='margin: 50px;box-sizing: border-box;margin:0;padding:10px;display:flex;flex-direction:column;width:100%; height:auto;background-color:#262D51;'>"+
        "<div style='display:flex;justify-content:space-between';><a style='color:white; font-size:large;'>"+doc.name+"</a><a style='color:white; font-size:large;'>"+doc.amount+"x</a></div>"+
        "<div style='display:flex;justify-content:space-between;'><a style='color:white; font-size:medium;'>"+doc.race + " " + doc.cardtype+"</a></div>";
        if(doc.archetype !== undefined){
            htmlST += "<div><a style='color:white; font-size:medium;'>"+doc.archetype +"</a></div>";   
        }     
        htmlST += "<div><a style='color:white; font-size:medium;'>"+doc.desc + "</a></div></div>";
        return htmlST;
        case "link monster":
            let htmlL = "<div style='margin: 50px;box-sizing: border-box;margin:0;padding:10px;display:flex;flex-direction:column;width:100%; height:auto;background-color:#262D51;'>"+
            "<div style='display:flex;justify-content:space-between';><a style='color:white; font-size:large;'>"+doc.name+"</a><a style='color:white; font-size:large;'>"+doc.amount+"x</a></div>"+
            "<div style='display:flex;justify-content:space-between;''><a style='color:white; font-size:medium;'>"+doc.race + " / " + doc.cardtype+"</a><a style='color:white; font-size:medium;'>"+doc.attribute+"</a></div>"+
            "<div><a style='color:white; font-size:medium;'>"+doc.atk  + " ATK </a></div>";
            if(doc.archetype !== undefined)
            htmlL += "<div><a style='color:white; font-size:medium;'>"+doc.archetype +"</a></div>";
            htmlL += "<div><a style='color:white; font-size:medium;'>Linkrating: "+doc.linkval +"</a></div>";
            htmlL += "<div><a style='color:white; font-size:medium;'>Linkmarker: "+doc.linkmarkers +"</a></div>";
            htmlL += "<div><a style='color:white; font-size:medium;'>"+doc.desc + "</a></div></div>";
        return htmlL;
        default:
        let htmlM = "<div style='margin: 50px;box-sizing: border-box;margin:0;padding:10px;display:flex;flex-direction:column;width:100%; height:auto;background-color:#262D51;'>"+
        "<div style='display:flex;justify-content:space-between';><a style='color:white; font-size:large;'>"+doc.name+"</a><a style='color:white; font-size:large;'>"+doc.amount+"x</a></div>"+
        "<div style='display:flex;justify-content:space-between;''><a style='color:white; font-size:medium;'>"+doc.race + " / " + doc.cardtype+"</a><a style='color:white; font-size:medium;'>"+doc.attribute+"</a></div>"+
        "<div><a style='color:white; font-size:medium;'>Level "+doc.level + "</a></div>"+
        "<div><a style='color:white; font-size:medium;'>"+doc.atk  + " ATK / " + doc.def +" DEF</a></div>";
        if(doc.archetype !== undefined)
            htmlM += "<div><a style='color:white; font-size:medium;'>"+doc.archetype +"</a></div>";
        if(doc.scale !== undefined)
            htmlM += "<div><a style='color:white; font-size:medium;'>Pendulumscale: "+doc.scale +"</a></div>";
        htmlM += "<div><a style='color:white; font-size:medium;'>"+doc.desc + "</a></div></div>";
        return htmlM;
    }
    
}

function back(){
    ipcRenderer.send('appAction', "back");
}

function exit(){
    ipcRenderer.send('appAction', "exit");
}

ipcRenderer.on("importRunning", (event, running) => {
    if(running){
    importRunning = true;
    document.getElementById('importAreaStatusText').style.color = "#F9F871"
    document.getElementById('importAreaStatusText').innerHTML = "Import is running. Please wait...."
    }
    else{
    importRunning = false;
    document.getElementById('importAreaStatusText').style.color = "#4FEAA2"
    document.getElementById('importAreaStatusText').innerHTML = "Import complete!";
    }
})