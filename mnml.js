var storage = chrome.storage.sync
var settings
var edit = false
var container = document.getElementById("container")
var trash = document.getElementById("trash")

//Apps
sortable = Sortable.create(container, {
  group: 'shared',
  draggable: ".app",
  handle: "img",
  animation: 150,
  disabled: true,
  onEnd: function(){
    saveApps()
    drawApps()
  }
})

//Trash
new Sortable(trash, {
  group: 'shared',
  draggable: ".app",
  handle: "img",
  animation: 150,
  onAdd: function(e){
    e.item.remove()
  }
})

//Listeners
document.body.addEventListener("contextmenu", editMode)
document.getElementById("add").addEventListener("click", addApp)
document.getElementById("save").addEventListener("click", saveChanges)
document.getElementById("save").addEventListener("click", stopEdit)
document.getElementById("cancel").addEventListener("click", cancelChanges)
document.getElementById("export").addEventListener("click", exportSettings)
document.getElementById("import").addEventListener("click", importSettings)
document.getElementById("reset").addEventListener("click", resetSettings)

//Let's go!
init()

function init(){
  loadSettings(function(){
    drawBg()
    drawApps()
    loadOptions()
  })
}

function loadSettings(callback){
  storage.get("settings", r => {
    if(r.settings == null){
      settings = getDefault()
    }
    else{
      settings = r.settings
    }
    callback()
  })
}

function saveSettings() {
  storage.set({ "settings": settings })
}

function importSettings(){
  let importer = document.getElementById("importFile")
  importer.addEventListener("change", function(c){
    var file = c.target.files[0]
    var reader = new FileReader()
    reader.readAsText(file)
    reader.onload = function(){
      settings = JSON.parse(this.result)
      saveSettings()
      window.location.reload()
    }
  })
  importer.click()
}

function exportSettings(){
  var json = JSON.stringify(settings)
  var blob = new Blob([json], {type: "text/json;charset=utf-8"})
  chrome.downloads.download({
    filename: "mnmltab.json",
    url: URL.createObjectURL(blob),
    saveAs: true
  })
}

function resetSettings(){
  if (confirm("Are you sure?")) {
    settings = getDefault()
    saveSettings()
    window.location.reload()
  }
}

function loadOptions() {
  var sliders = ["size", "spacing", "radius", "columns"]

  sliders.forEach(o => {
    let i = document.getElementById(o)
    let s = document.getElementById(o + "_val")

    //set current value to input
    i.value = settings[o]
    s.innerHTML = ""
    let nt = document.createTextNode(settings[o])
    s.appendChild(nt)

    //setup listener
    i.oninput = function () {
      settings[o] = parseInt(this.value)
      s.innerHTML = ""
      let nt = document.createTextNode(parseInt(this.value))
      s.appendChild(nt)
      drawApps()
    }
  })

  var bg = document.getElementById("background")
  bg.value = settings.background

  bg.onchange = function () {
    if (this.value == "") {
      settings.background = getDefault().background
      drawBg()
    }
    else {
      settings.background = this.value
      drawBg()
    }
  }
}

function getDefault(){
  return {
    "background": "img/bg.jpg",
    "size": 90,
    "spacing": 12,
    "radius": 50,
    "columns": 4,
    "apps": [
      {
        "icon": "img/google_mail.png",
        "url": "https://mail.google.com"
      },
      {
        "icon": "img/google_photos.png",
        "url": "https://photos.google.com"
      },
      {
        "icon": "img/google_maps.png",
        "url": "https://maps.google.com"
      },
      {
        "icon": "img/google_calendar.png",
        "url": "https://calendar.google.com"
      },
      {
        "icon": "img/google_drive.png",
        "url": "https://drive.google.com"
      },
      {
        "icon": "img/hangouts.png",
        "url": "https://hangouts.google.com"
      },
      {
        "icon": "img/youtube.png",
        "url": "https://youtube.com"
      },
      {
        "icon": "img/facebook.png",
        "url": "https://www.facebook.com"
      },
      {
        "icon": "img/messenger.png",
        "url": "https://messenger.com"
      },
      {
        "icon": "img/instagram.png",
        "url": "https://instagram.com"
      },
      {
        "icon": "img/twitter.png",
        "url": "https://twitter.com"
      },
      {
        "icon": "img/reddit.png",
        "url": "https://reddit.com"
      }
    ]
  }
}

function drawBg(){
  document.body.style.backgroundImage = "url(\""+ settings.background + "\")"
}

function drawApps(){
  container.innerHTML = "";

  var combined = (settings.size + (settings.spacing * 2))
  var maxWidth = combined * settings.columns
  var maxHeight = Math.ceil(settings["apps"].length / settings.columns)
  
  container.style.width = maxWidth + "px"
  container.style.marginLeft = -maxWidth/2 + "px"
  container.style.marginTop = -(maxHeight * combined)/2 + "px"

  trash.style.width = settings.size + "px"
  trash.style.height = settings.size + "px"
  trash.style.marginLeft = -settings.size/2 - 10 + "px" //-10 for padding
  trash.style.backgroundSize = settings.size/2 + "px"

  for (let i = 0; i < settings["apps"].length; i++) {
    a = settings["apps"][i]
    var icon = document.createElement("img")
    icon.src = (a.icon == "") ? "img/default.png" : a.icon ;

    icon.style.borderRadius = settings.radius + "%"
    icon.style.width = settings.size + "px"

    var link = document.createElement("div")
    link.style.margin = settings.spacing + "px"
    link.dataset.url = a.url
    link.dataset.icon = a.icon
    link.dataset.index = i
    link.classList.add("app")
    if (edit === false) {
      link.addEventListener("click", openURL)
      link.addEventListener("auxclick", openURL)
    } else {
      link.addEventListener("click", editApp)
    }
    link.appendChild(icon)
    container.appendChild(link)
  }
}

function openURL(e) {
  var u = this.dataset.url
  //must be left or middle click...
  if (e.button === 0 || e.button === 1) {
    //if pressing ctrl, or meta, or middle click, new tab
    if (e.ctrlKey === true || e.metaKey === true || e.button === 1) {
      chrome.tabs.create({ url: u, active: false })
    }
    //otherwise current tab
    else {
      document.body.remove()
      chrome.tabs.getCurrent(function (t) {
        chrome.tabs.update(t.id, { url: u });
      })
    }
  }
}

function saveApps() {
  settings.apps = []
  apps = document.getElementsByClassName("app")
  for (let i = 0; i < apps.length; i++) {
    settings.apps.push({
      "url": apps[i].dataset.url,
      "icon": apps[i].dataset.icon,
    })
  }
}

function editMode(c){
  //right click to enable/disable edit mode
  c.preventDefault()
  if(c.button === 2){ 
    if(edit === false){
      edit = true
      document.getElementById("options").style.display = "inherit"
      document.getElementById("trash").style.display = "inherit"
      document.getElementById("controls").style.display = "inherit"
      container.classList.add("edit")
      sortable.option("disabled", false)
      drawApps()
    } else {
      saveChanges()
    }
  }
}

function addApp() {
  var i = Math.floor(Math.random() * getDefault().apps.length)
  settings["apps"].push(
    getDefault().apps[i]
  )
  drawApps()
}

function saveChanges() {
  stopEdit()
  saveApps()
  saveSettings()
  drawApps()
}

function cancelChanges() {
  stopEdit()
  init()
}

function stopEdit(){
  edit = false
  document.getElementById("options").style.display = "none"
  document.getElementById("trash").style.display = "none"
  document.getElementById("controls").style.display = "none"
  container.classList.remove("edit")
  sortable.option("disabled", true)
}

function editApp() {
  if (!this.querySelector("#editor")){

    //remove any other editor
    if(document.getElementById("editor")){
      document.getElementById("editor").remove()
    }

    let editor = document.createElement("div")
    editor.classList.add("editor")
    editor.id = "editor"
    editor.addEventListener("click", function(c){
      c.stopPropagation()
    })
    editor.style.marginLeft = (-270/2) + (settings.size/2)

    let inputIcon = document.createElement("input")
    inputIcon.value = this.dataset.icon
    inputIcon.onchange = function(){
      let app = this.parentNode.parentNode
      app.dataset.icon = this.value
      app.querySelector("img").src = this.value
      settings.apps[app.dataset.index].icon = this.value
    }
    editor.appendChild(inputIcon)

    let inputUrl = document.createElement("input")
    inputUrl.value = this.dataset.url
    inputUrl.onchange = function(){
      let app = this.parentNode.parentNode
      app.dataset.url = this.value
      settings.apps[app.dataset.index].url = this.value
    }
    editor.appendChild(inputUrl)

    this.appendChild(editor)
  } else {
    this.querySelector("#editor").remove()
  }
}