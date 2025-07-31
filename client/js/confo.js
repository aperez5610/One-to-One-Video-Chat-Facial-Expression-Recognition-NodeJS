///////////////////////////////////////////////////////
//
// File: confo.js
// This is the main application file for client end point. It tries to use Enablex Web Toolkit to
// communicate with EnableX Servers
//
// Last Updated: 29-11-2018
// Reformat, Indentation, Inline Comments
//
/////////////////////////////////////////////////////
let camList = null;
let micList = null;
let faceTrackStream = null;
const shareURL = `https://${window.location.hostname}`
let joinRoomRes = null;
let faceX = null;
let faceComp = null;
let isCheckSimilarity = false;
let selectedImage = [];
let selectedImgIndex = 0;
let facexRunning = false;
var ATList = [];
const faceConfig = {
  maxInputFrameSize: 160,
  smoothness: 0.99,
  enableBalancer: false,
  threshold: 0.7,
  fullFrameDetection: true,
};

let isAppendFaceDetail = false;
let faceTrackingData = {
  attention: null,
  age: null,
  gender: null,
  pose: null,
  face: null,
  liveness: "",
  similarity: "",
  emotions: null,
  features: null,
  arousalValence: null,
};
var remoteTrackingData = {};
let previousSendData = null;
let imgURL = null;
let isCheckLiveness = false;
let facesURL = [];

var localStream = null;
var username = null;
var room;
var countStream = 0;
var localStreamId = null;
var urlData = null;
var SUPPORT_URL = "https://enablex.io";
// Player Options
var options = {
  id: "vcx_1001",
  attachMode: "",
  player: {
    autoplay: "",
    name: "",
    nameDisplayMode: "",
    frameFitMode: "bestFit",
    skin: "classic",
    class: "",
    height: "inherit",
    width: "inherit",
    minHeight: "120px",
    minWidth: "160px",
    aspectRatio: "",
    volume: 0,
    media: "",
    loader: {
      show: false,
      url: "/img/loader.gif",
      style: "default",
      class: "",
    },
    backgroundImg: "/img/player-bg.gif",
  },
  toolbar: {
    displayMode: "auto",
    autoDisplayTimeout: 0,
    position: "top",
    skin: "default",
    iconset: "default",
    class: "",
    buttons: {
      play: false,
      share: false,
      mic: false,
      resize: false,
      volume: false,
      mute: false,
      record: false,
      playtime: false,
      zoom: false,
    },
    branding: {
      display: false,
      clickthru: "https://www.enablex.io",
      target: "new",
      logo: "/img/enablex.png",
      title: "EnableX",
      position: "right",
    },
  },
};


var allStreamsSubscribed = false;

var binarystring; // Global intentionally
var config = {
  audio: { deviceId: null },
  video: { deviceId: null },
  data: true,
  audioMuted: false, // Audio muted on entry to room
  videoMuted: false,
  videoSize: [],
  options: options,
  attributes: {
    name: name,
  },
};
var name = "";

let createTokenParams = 688bc6babfc521b8e14d0f80;
let token = 688bc6babfc521b8e14d0f80;
let faceAIConfig = {
  faceDetector:{minFaceSizeAt640: 50, maxInputFrameSize: 720, multiFace: true},
  facePose:{},
  faceAge:{},
  faceEmotion:{},
  faceGender:{smoothness: 0.95, threshold: 0.70},
  faceFeatures:{smoothness: 0.90},
  faceArousalValence:{},
  faceAttention:{},
}

var emoAngryId = document.getElementById("emo_angry");
var emoDisgust = document.getElementById("emo_disgust");
var emoFear = document.getElementById("emo_fear");
var emoHappy = document.getElementById("emo_happy");
var emoSad = document.getElementById("emo_sad");
var emoSurprise = document.getElementById("emo_surprise");
var emoNutral = document.getElementById("emo_neutral");
var attentionId = document.getElementById("attention");
var appendNode = document.getElementById("face_features");
var affectsArousal = document.getElementById("affects_arousal");
var affectsValence = document.getElementById("affects_valence");
var likelyAge = document.getElementById("likely_age");
var genderDiv = document.getElementById("gender_div");

window.onload = function () {
  $("#faces_snapshot").hide();
  $("#compare_div").hide();
  faceX = new  EnxFaceAI();
  faceComp = new EnxFaceCompare();
  urlData = parseURLParams(window.location.href);
  name = urlData.user_ref[0];
  createTokenParams = createDataJson(window.location.href);
  console.log("Window Params",createTokenParams);
  EnxRtc.getDevices(function (arg) {
    if (arg.result === 0) {
      camList = arg.devices.cam;
      micList = arg.devices.mic;
      config.video.deviceId = camList[0].deviceId;
      config.audio.deviceId = micList[0].deviceId;
      listOutMic(micList);
      listOutCam(camList);
      if (createTokenParams.roomId === null) {
        if(createTokenParams.appId == null)
        {
            createRoom(null,function (result) {
                createTokenParams.roomId = result;
                createJoinToken(createTokenParams);
            });
        }
        else{
            createRoom(createTokenParams.appId,function (result) {
                createTokenParams.roomId = result;
                createJoinToken(createTokenParams);
            });
        }
      } else {
        createJoinToken(createTokenParams);
      }
    } else if (arg.result === 1153) {
      $("#unsupported_browser_message").show();
    } else {
      $("#media-device-permission-error").show();
    }
  });

};
function parseURLParams(url) {
  var queryStart = url.indexOf("?") + 1,
    queryEnd = url.indexOf("#") + 1 || url.length + 1,
    query = url.slice(queryStart, queryEnd - 1),
    pairs = query.replace(/\+/g, " ").split("&"),
    parms = {},
    i,
    n,
    v,
    nv;

  if (query === url || query === "") return;

  for (i = 0; i < pairs.length; i++) {
    nv = pairs[i].split("=", 2);
    n = decodeURIComponent(nv[0]);
    v = decodeURIComponent(nv[1]);

    if (!parms.hasOwnProperty(n)) parms[n] = [];
    parms[n].push(nv.length === 2 ? v : null);
  }
  return parms;
};


// Function: To create user-json for Token Request
function createDataJson (url) {
  urlData = parseURLParams(url);
  username = urlData.user_ref[0];
  var retData = {
    name: urlData.user_ref[0],
    role: urlData.usertype[0],
    roomId: urlData.roomId ? urlData.roomId[0] : null,
    user_ref: urlData.user_ref[0],
      appId: urlData.appId ? urlData.appId[0] : null,
  };
  return retData;
};

function startTrack (){
  joinRoom(token, config);
}

function createJoinToken(params) {
  createToken(params, function (response) {
    token = response;
    $("#localStreamModal").modal("show");

  });
}

var setLiveStream = function (stream, remoteData) {
  // Listening to Text Data
  stream.addEventListener("stream-data", function (e) {
    var text = e.msg.textMessage;
    var html = $(".multi_text_container_div").html();
    $("#multi_text_container_div").html(html + text + "<br>");
  });
  var name =
    stream.getAttributes().name !== undefined
      ? stream.getAttributes().name
      : "";
  if (!stream.local) {
    var newStreamDiv = document.createElement("div");
    newStreamDiv.setAttribute("id", remoteData.clientId);
    newStreamDiv.setAttribute("class", "live_stream_div");
    //document.getElementById("remote_user_name").innerHTML = remoteData.name;
    var multi_video_div = document.getElementById("multi_video_container_div");
    // multi_video_div.style.width = '100%';
    // multi_video_div.style.height = '350px';
    // multi_video_div.style.objectFit = 'container';
    multi_video_div.appendChild(newStreamDiv);
    options.player.height = "inherit";
    options.player.width = "inherit";
    options.player.class = "test_class";
    $("#local_video_show").hide();
    stream.show(remoteData.clientId, options);
    countStream++;
    // if (faceTrackStream === "remoteStream") {
    //   faceTrackInit(joinRoomRes, stream);
    // }
  } else {
    options.player.height = "inherit";
    options.player.width = "inherit";
    options.player.loader.class = "";
    options.player.loader.show = false;
    document.getElementById("local_user_name").innerHTML = username;
    stream.show("local_video_div", options);
    stream.show("local_video_show", options);
    startTimer();
    //if (faceTrackStream === "localStream") {
      faceTrackInit(joinRoomRes, stream);
    //}
  }
};

// JOin Room
function joinRoom() {
  if (createTokenParams.role === "moderator" && urlData.action[0] === "2") {
    if(createTokenParams.appId !== null)
    {
        document.getElementById("link").value = `${shareURL}/confo.html?roomId=${createTokenParams.roomId}&usertype=participant&user_ref=participant&appId=${createTokenParams.appId}`;

    }else{
        document.getElementById("link").value = `${shareURL}/confo.html?roomId=${createTokenParams.roomId}&usertype=participant&user_ref=participant`;

    }
        $("#remoteStreamModal").modal("show");
    faceTrackStream = "remoteStream";
  } else if(createTokenParams.role === "participant") {
    faceTrackStream = "remoteStream";
  }else{
    faceTrackStream = "localStream";
  }
  localStream = EnxRtc.joinRoom(token, config, function (response, error) {
    if (error && error != null) {
    }
    if (response && response != null) {
      room = response.room;
      var ownId = response.publishId;
      joinRoomRes = response;

      var roomStreamsLength = response.streams.length;
      var streamsCount = 0;

      setLiveStream(localStream);
      for (var i = 0; i < response.streams.length; i++) {
        streamsCount += 1;
        if (streamsCount == roomStreamsLength) {
          togglElementDisplay(_QS('#loading-spinner'), 'none');
        }
        room.subscribe(response.streams[i]);
      }
      // //for face tracking
      // faceX.init(response, localStream, (res) => {
      //   console.log(res, "init result");
      //   if (res.result === 0) {
      //     startFaceTrack();
      //   }
      // });

      room.addEventListener("connected", function (event) {
        console.log(event, "event");
      });
      // Active Talker list is updated
      room.addEventListener("active-talkers-updated", function (event) {
        ATList = event.message.activeList;
        document
          .querySelectorAll(".classic_vcx_stream")
          .forEach(function (item) {
            item.classList.remove("border-b-active");
          });
        var video_player_len = document.querySelector(
          "#multi_video_container_div"
        ).childNodes;
        if (
          event.message &&
          event.message !== null &&
          event.message.activeList &&
          event.message.activeList !== null
        ) {
          if (ATList.length == video_player_len.length) {
            return;
          } else {
            document.querySelector("#multi_video_container_div").innerHTML = "";
            for (stream in room.remoteStreams.getAll()) {
              var st = room.remoteStreams.getAll()[stream];
              for (j = 0; j < ATList.length; j++) {
                if (ATList[j].streamId == st.getID()) {
                  var remoteData = ATList[j];
                  setLiveStream(st, remoteData);
                }
              }
            }
          }
        }

        if (ATList !== null && ATList.length) {
          var active_talker_stream = ATList[0].streamId;

          document
            .getElementById("stream" + active_talker_stream)
            .classList.add("border-b-active");
        }
        console.log("Active Talker List :- " + JSON.stringify(event));
        // if(!facexRunning){
        //   faceX.init(response, room.remoteStreams.get(ATList[0].streamId), (res) => {
        //     console.log(res, "init result");
        //     if (res.result === 0) {
        //       startFaceTrack();
        //       facexRunning = true;
        //     }
        //   });
        // }
      });

      // Stream has been subscribed successfully
      room.addEventListener("stream-subscribed", function (streamEvent) {
        var stream =
          streamEvent.data && streamEvent.data.stream
            ? streamEvent.data.stream
            : streamEvent.stream;
        for (k = 0; k < ATList.length; k++) {
          if (ATList[k].streamId == stream.getID()) {
            var remoteData = ATList[k];
            setLiveStream(stream, remoteData);
          }
        }
      });

      room.addEventListener("user-connected", function (event) {
        console.log(event);
        $("#local_video_show").hide();
      });

      room.addEventListener("user-disconnected", function (event) {
        console.log(event);
        $("#local_video_show").show();
        //document.getElementById("remote_user_name").innerHTML = "";
        facexRunning = false;
      });

      // Listening to Incoming Data
      room.addEventListener("active-talker-data-in", function (data) {
        console.log("active-talker-data-in" + data);
        var obj = {
          msg: data.message.message,
          timestamp: data.message.timestamp,
          username: data.message.from,
        };
        // Handle UI to display message
      });

      // Stream went out of Room
      room.addEventListener("stream-removed", function (event) {
        console.log(event);
      });

      //Listening to face data
      room.addEventListener("user-data-received", function (event) {
        const data = JSON.parse(event.message.message);
        remoteTrackingData = null;
        remoteTrackingData = data;
        //optimizeRemoteData(faceTrackingData);
        //appendRemoteFaceDetail(data);
        //console.log(data, "faceTrackingData.......");
      });
    }
  });
}

function audioMute() {
  var elem = document.getElementsByClassName("icon-confo-mute")[0];
  var onImgPath = "../img/mike.png",
    onImgName = "mike.png";
  var offImgPath = "../img/mute-mike.png",
    offImgName = "mute-mike.png";
  var currentImgPath = elem.src.split("/")[elem.src.split("/").length - 1];
  if (currentImgPath === offImgName) {
    localStream.unmuteAudio(function (arg) {
      elem.src = onImgPath;
      elem.title = "mute audio";
    });
  } else if (currentImgPath === onImgName) {
    localStream.muteAudio(function (arg) {
      elem.src = offImgPath;
      elem.title = "unmute audio";
    });
  }
}

function startTimer(){
	 var timer = $("#timer");

    function updateTimer() {
        var myTime = timer.html();
        var ss = myTime.split(":");
        var dt = new Date();
        dt.setHours(0);
        dt.setMinutes(ss[0]);
        dt.setSeconds(ss[1]);

        var dt2 = new Date(dt.valueOf() + 1000);
        var temp = dt2.toTimeString().split(" ");
        var ts = temp[0].split(":");

        timer.html(ts[1]+":"+ts[2]);
        setTimeout(updateTimer, 1000);
    }

    setTimeout(updateTimer, 1000);
}

function videoMute() {
  var elem = document.getElementsByClassName("icon-confo-video-mute")[0];
  var onImgPath = "../img/video.png",
    onImgName = "video.png";
  var offImgPath = "../img/mute-video.png",
    offImgName = "mute-video.png";
  var currentImgPath = elem.src.split("/")[elem.src.split("/").length - 1];
  if (currentImgPath === offImgName) {
    localStream.unmuteVideo(function (res) {
      var streamId = localStream.getID();
      var player = document.getElementById("stream" + streamId);
      player.srcObject = localStream.stream;
      player.play();
      elem.src = onImgPath;
      elem.title = "mute video";
    });
  } else if (currentImgPath === onImgName) {
    localStream.muteVideo(function (res) {
      elem.src = offImgPath;
      elem.title = "unmute video";
    });
  }
}

function endCall() {
  var r = confirm("Are you really want to Quit??");
  if (r == true) {
    window.location.href = SUPPORT_URL;
  }
}
function checkLiveness() {
  alert("Please move your face right slowely");
  isCheckLiveness = true;
  faceTrackingData.liveness = "";
}

function resetLiveness() {
  isCheckLiveness = false;
  faceTrackingData.liveness = "";
  $("#compare_div").hide();
  faceTrackingData.similarity = "";
  ("selected_image0");
  document.getElementById("selected_image0").innerHTML = "";
  document.getElementById("selected_image1").innerHTML = "";
  selectedImage = [];
}

function sendFaceData(faceData){
  //previousSendData = {...faceData};
  room.sendUserData(JSON.stringify(faceData), true, []);
  faceTrackingData = {};
}
function appendRemoteFaceDetail(remoteData) {
  isAppendFaceDetail = true;
  setInterval(function () {
    optimizeRemoteData(faceTrackingData);
    if(!remoteTrackingData){
      return;
    }
    if (remoteTrackingData.emotions) {
      emoAngryId.style.height = remoteTrackingData.emotions.Angry + "px";
      emoDisgust.style.height = remoteTrackingData.emotions.Disgust + "px";
      emoFear.style.height = remoteTrackingData.emotions.Fear + "px";
      emoHappy.style.height = remoteTrackingData.emotions.Happy + "px";
      emoSad.style.height = remoteTrackingData.emotions.Sad + "px";
      emoSurprise.style.height = remoteTrackingData.emotions.Surprise + "px";
      emoNutral.style.height = remoteTrackingData.emotions.Neutral + "px";
    }

    if (remoteTrackingData.attention >=0) {
      attentionId.style.height = remoteTrackingData.attention + "px";
    }
    if (remoteTrackingData.gender) {
      genderDiv.innerHTML = `<li>${remoteTrackingData.gender}</li>`;
    }

    if (remoteTrackingData.features) {
      let appendNode = document.getElementById("face_features");
      appendNode.innerHTML = "";
      for (let key in remoteTrackingData.features) {
        if (remoteTrackingData.features.hasOwnProperty(key)) {
          //let value = remoteTrackingData.features[key];
          //if (value >= 0.4) {
            let node = document.createElement("LI");
            let textnode = document.createTextNode(key);
            node.appendChild(textnode);
            appendNode.appendChild(node);
          //}
        }
      }
    }
    if (remoteTrackingData.age) {
      likelyAge.noUiSlider.set(remoteTrackingData.age);
    }
    if (remoteTrackingData.arousalValence) {
      affectsArousal.noUiSlider.set(remoteTrackingData.arousalValence.arousal);
      affectsValence.noUiSlider.set(remoteTrackingData.arousalValence.valence);
    }
  }, 1000/3);
}


function startFaceTrack() {
  faceX.startFaceDetector((res) => {
    if (res.result === 0) {
      if (faceTrackStream !== "localStream") {
        appendRemoteFaceDetail();
      }
      window.addEventListener(`face-detector`, (evt) => {
        const faces = evt.detail.totalFaces;
        //console.log('Face detector result', faces);
        //faceTrackingData.face = faces.length;
      });
    }
  });

  // faceX.startFacePose((res) => {
  //   if (res.result === 0) {
  //     window.addEventListener(`face-pose`, (evt) => {
  //       //console.log(evt.detail, "facex pose event...........");
  //       const pitch = evt.detail.output.pose.pitch.toFixed(2);
  //       const yaw = evt.detail.output.pose.yaw.toFixed(2);
  //       //const roll = evt.detail.output.pose.yaw.toFixed(2);
  //       if (yaw > 0.2 || yaw < -0.2 || pitch > 0.2 || pitch < -0.2)
  //         faceTrackingData.pose = "Please look into the camera";
  //       else faceTrackingData.pose = "Good";
  //     });
  //   }
  // });

  faceX.startFaceAge((res) => {
    if (res.result === 0) {
      window.addEventListener(`face-age`, (evt) => {
        //console.log(evt.detail, "facex age event...........");
        //const age = Math.ceil(evt.detail.output.numericAge / 5) * 5;
        faceTrackingData.age = evt.detail.output.numericAge; // age - 5 + "-" + age;
        if (faceTrackStream === "localStream") {
          likelyAge.noUiSlider.set(faceTrackingData.age);
        }else{
          //sendFaceData(faceTrackingData);
        }

      });
    }
  });
  faceX.startFaceEmotion((res) => {
    if (res.result === 0) {
      window.addEventListener(`face-emotion`, (evt) => {
        const emotions = evt.detail.output.emotion;
        const tempEmotion = {};
        for (const emotion in emotions) {
          tempEmotion[emotion] = parseInt(emotions[emotion].toFixed(2)*100);
        }
        faceTrackingData.emotions = tempEmotion;
        if (faceTrackStream === "localStream") {
          emoAngryId.style.height = faceTrackingData.emotions.Angry + "px";
          emoDisgust.style.height = faceTrackingData.emotions.Disgust + "px";
          emoFear.style.height = faceTrackingData.emotions.Fear + "px";
          emoHappy.style.height = faceTrackingData.emotions.Happy + "px";
          emoSad.style.height = faceTrackingData.emotions.Sad + "px";
          emoSurprise.style.height = faceTrackingData.emotions.Surprise + "px";
          emoNutral.style.height = faceTrackingData.emotions.Neutral + "px";
        }
        // else{
        //   sendFaceData(faceTrackingData);
        // }
      });
    }
  });
  faceX.startFaceGender((res) => {
    if (res.result === 0) {
      window.addEventListener(`face-gender`, (evt) => {
        //console.log(evt.detail, "facex gender event...........");
        const gender = evt.detail.output.mostConfident;
        faceTrackingData.gender = gender ? gender: "";
        if (faceTrackStream === "localStream") {
          genderDiv.innerHTML = `<li>${faceTrackingData.gender}</li>`;
        }else{
          //sendFaceData(faceTrackingData);
        }
      });
    }
  });
  faceX.startFaceFeatures((res) => {
    if (res.result === 0) {
      window.addEventListener(`face-features`, (evt) => {
        const features = evt.detail.output.features;
        const tempFeatures = {};
        for (const feature in features) {
          if(features[feature]>=0.4){
            tempFeatures[feature] = features[feature].toFixed(2);
          }
        }
        faceTrackingData.features = tempFeatures;
        //console.log(faceTrackingData.features, "facex features event...........");
        if (faceTrackStream === "localStream") {
          appendNode.innerHTML = "";
          for (let key in faceTrackingData.features) {
            if (faceTrackingData.features.hasOwnProperty(key)) {
              let value = faceTrackingData.features[key];
              //if (value >= 0.4) {
                let node = document.createElement("LI");
                let textnode = document.createTextNode(key);
                node.appendChild(textnode);
                appendNode.appendChild(node);
             // }
            }
          }
        }else{
          //sendFaceData(faceTrackingData);
        }
      });
    }
  });
  faceX.startFaceArousalValence((res) => {
    if (res.result === 0) {
      window.addEventListener(`face-arousal-valence`, (evt) => {
        const arousalValence = evt.detail.output;
        faceTrackingData.arousalValence = {arousal: arousalValence.arousal.toFixed(2), valence: arousalValence.valence.toFixed(2)};
        if (faceTrackStream === "localStream") {
          affectsArousal.noUiSlider.set(faceTrackingData.arousalValence.arousal);
          affectsValence.noUiSlider.set(faceTrackingData.arousalValence.valence);
        }else{
          //sendFaceData(faceTrackingData);
        }
        //console.log(evt.detail, "facex arousal-valence event...........");
      });
    }
  });
  faceX.startFaceAttention((res) => {
    if (res.result === 0) {
      window.addEventListener(`face-attention`, (evt) => {
        //console.log(evt.detail.output.attention.toFixed(2), "facex attention event...........");
        const attention = evt.detail.output.attention.toFixed(2) * 100;
        faceTrackingData.attention = attention;
        if (faceTrackStream === "localStream") {
          attentionId.style.height = attention + "px";
        }else{
          //sendFaceData(faceTrackingData);
        }
      });
    }
  });
}

function faceTrackInit(data, stream) {
  faceX.init(data, stream, faceAIConfig, (res) => {
    console.log(res, "init result");
    if (res.result === 0) {
      startFaceTrack();
    }
  });
}



$("#Pic_Taker").click(function () {
  $(this).data("clicked", true);
});

$("#continue-3").click(function () {
  $("#localStreamModal").modal("hide");
});



function stopFaceTracking() {
  faceX.stopFaceAI((evt) => {
    console.log(evt, "stop face ai");
  });
}

function startFaceEmo() {
  faceX.startFaceEmotion({}, (res) => {
    if (res.result === 0) {
      window.addEventListener("facex-emotion", (evt) => {
        console.log(evt.detail, "facex emotion event...........");
      });
    }
  });
}

function stopFaceEmo() {
  faceX.stopFaceEmotion((evt) => {
    console.log(evt, "stop face emotion evt..............");
  });
}

function listOutCam(camLst) {
  for (var i = 0; i < camLst.length; i++) {
    var x = document.getElementById("cam");
    var option = document.createElement("option");
    option.text = camLst[i].label;
    var camoptId = camLst[i].deviceId;
    option.setAttribute("id", camoptId);
    x.add(option);
  }
}

function listOutMic(micLst) {
  for (var j = 0; j < micLst.length; j++) {
      var x = document.getElementById("mic");
      var option = document.createElement("option");
      option.text = micLst[j].label;
      var micoptId = micLst[j].deviceId;
      option.setAttribute("id", micoptId);
      x.add(option);
  }
}

$(document).on("change", "#cam", function () {
  config.video.deviceId = $(this).find("option:selected").attr("id");
  //localStorage.setItem("cam", $(this).find("option:selected").attr("id"));
  setCookie("vcxCamId", $(this).find("option:selected").val());
});

$(document).on("change", "#mic", function () {
  config.audio.deviceId = $(this).find("option:selected").attr("id");
  localStorage.setItem("mic", $(this).find("option:selected").attr("id"));
  setCookie("vcxMicId", $(this).find("option:selected").val());
});

$(document).on("click", "#shareURL", function () {
  if (faceTrackStream === "remoteStream") {
    $("#remoteStreamModal").modal("show");
  }
});
var diffPer = 5;
function optimizeRemoteData(data){
  if(!previousSendData){
    //setTimeout(function(){ sendFaceData(data); }, 5000);
    previousSendData = {...data};
    sendFaceData(data);
    return;
  }

  let optimizeData = {};
  if(data && data.age){
    if(!previousSendData.age){
      optimizeData.age = data.age;
    }else{
      let diffAge = getPercentageChange(previousSendData.age, data.age);
      if (diffAge>= diffPer || diffAge<= -diffPer){
        optimizeData.age = data.age;
      }
    }
  }

  if(data && data.attention){
    if(!previousSendData.attention){
      optimizeData.attention = data.attention;
    }else{
      let diffAttention = getPercentageChange(previousSendData.attention, data.attention);
      if (diffAttention>= diffPer || diffAttention<= -diffPer){
        optimizeData.attention = data.attention;
      }
    }
  }
  if(data && data.gender){
    if(data.gender !== previousSendData.gender || !previousSendData.gender){
      optimizeData.gender = data.gender;
    }
  }

  if(data && data.arousalValence){
    if(!previousSendData.arousalValence){
      optimizeData.arousalValence = data.arousalValence;
    }else{
      for (const av in data.arousalValence) {
        const tempArousalValence = {};
      const diffArrousal = getPercentageChange(previousSendData.arousalValence?.arousal, data.arousalValence?.arousal); //valence
      const diffValence = getPercentageChange(previousSendData.arousalValence?.valence, data.arousalValence?.valence);
      if (diffArrousal>= diffPer || diffArrousal<= -diffPer){
        tempArousalValence.arousal = data.arousalValence.arousal;
      }
      if (diffValence>= diffPer || diffValence<= -diffPer){
        tempArousalValence.valence = data.arousalValence.valence;
      }
      if(tempArousalValence.arousal || tempArousalValence.valence){
        optimizeData.arousalValence = tempArousalValence;
      }
      }
    }
  }

  if(data && data.emotions){
    if(!previousSendData.emotions){
      optimizeData.emotions = data.emotions;
    }else{
      const tempEmo = {};
      for (const emo in data.emotions) {
        if(previousSendData.emotions?.[emo]){
          const diffEmo = getPercentageChange(previousSendData.emotions[emo], data.emotions[emo]);
          if (diffEmo>= diffPer || diffEmo<= -diffPer){
            tempEmo[emo] = data.emotions[emo];
          }
        }
      }
      if(Object.keys(tempEmo).length !== 0){
        optimizeData.emotions = tempEmo;
      }
    }
  }

  if(data && data.features){
    if(!previousSendData.features){
      optimizeData.features = data.features;
    }else{
      const tempFeatures = {};
      for (const fea in data.features) {
        if(previousSendData.features?.[fea]){
         if(previousSendData.features[fea] !== data.features[fea]){
          const diffFea = getPercentageChange(previousSendData.features[fea], data.features[fea]);
          if (diffFea>= diffPer || diffFea<= -diffPer){
            tempFeatures[fea] = data.features[fea];
          }

         }
        }else{
          tempFeatures[fea] = data.features[fea];
        }
      }
      if(Object.keys(tempFeatures).length !== 0){
        optimizeData.features = tempFeatures;
      }
    }
  }

  if(Object.keys(optimizeData).length !== 0){
    sendFaceData(optimizeData);
  }
  previousSendData = {...data};
}

function getPercentageChange(oldNumber, newNumber){
  const decreaseValue = oldNumber - newNumber;
  return (decreaseValue / oldNumber) * 100;
}

function togglElementDisplay(element, display) {
  if (element) {
    element.style.display = `${display}`;
  }
}

function _QS(selector, all = false) {
  if (all) {
    return document.querySelectorAll(selector);
  }
  return document.querySelector(selector);
}
