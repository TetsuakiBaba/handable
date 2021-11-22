var g_landmarks = [];



// ここからMediaPipeの記述
function onResults(results) {
    if (results.multiHandLandmarks) {
        g_landmarks = [];
        for (const landmarks of results.multiHandLandmarks) {
            g_landmarks.push(landmarks);

        }
        // 指文字認識をさせるタイミングはここでやるのがいいと思う．
    }
    draw();
}

// ここまでMediaPipeの記述

var camera;
var video;
var cam;

function setup() {
    // put setup code here
    var mycanvas = createCanvas(windowWidth, windowHeight);
    console.log(mycanvas);
    document.querySelector('#p5Canvas').appendChild(mycanvas.elt);
    //mycanvas.parent('#p5canvas');
    // video = createCapture(VIDEO);
    // video.size(1280, 720);
    // video.hide();
    noLoop();

}

function draw() {
    clear();

    //background(127);

    //image(video, 0, 0);


    if (g_landmarks.length > 0) {
        for (landmarks of g_landmarks) {
            // beginShape(POINTS);
            // let count = 0;
            // for (landmark of landmarks) {
            //     vertex(
            //         width * (1.0 - landmark.x),
            //         height * landmark.y
            //     );
            //     text(count, width * (1.0 - landmark.x), height * landmark.y);
            //     count++;
            // }
            // endShape();

            let array_points = [
                [0, 1, 2, 5, 9, 13, 17, 0],
                [2, 3, 4],
                [5, 6, 7, 8],
                [9, 10, 11, 12],
                [13, 14, 15, 16],
                [17, 18, 19, 20]
            ];
            strokeWeight(width / 100);
            noFill();
            stroke(0, 200);
            for (array_point of array_points) {
                beginShape();
                curveVertex(
                    width * (1.0 - landmarks[array_point[0]].x),
                    height * (landmarks[array_point[0]].y)
                );
                for (point of array_point) {
                    curveVertex(
                        width * (1.0 - landmarks[point].x),
                        height * landmarks[point].y
                    );
                }
                curveVertex(
                    width * (1.0 - landmarks[array_point[array_point.length - 1]].x),
                    height * (landmarks[array_point[array_point.length - 1]].y)
                );
                endShape();
            }

        }
    }

    // strokeWeight(1);
    // text("p5 and MediaPipe Hands Demo", 20, 20);
    // noFill();
    // stroke(0);
    // strokeWeight(5);
    // rect(0, 0, width, height);
    // circle(mouseX, mouseY, 20);
}

var videoElement;
var hands;
function keyPressed() {

    if (key == ' ') {
        navigator.mediaDevices.enumerateDevices()
            .then(function (devices) {
                devices.forEach(function (device) {
                    console.log(device.kind + ": " + device.label +
                        " id = " + device.deviceId);
                });
            })
            .catch(function (err) {
                console.log(err.name + ": " + err.message);
            });
    }
    // if (key == 's') {
    //     startMediaPipeHands();
    // }
    // else if (key == 'c') {
    //     stopMediaPipeHands();
    // }

    // console.log(document.querySelector('body'));

}

function toggleMediaPipeHands(_deviceId) {

    if (document.querySelector('video')) {
        stopMediaPipeHands();
    }
    else {
        startMediaPipeHands(_deviceId);
    }
}
function startMediaPipeHands(_deviceId) {
    videoElement = document.createElement('video');// document.getElementsByClassName('input_video')[0];
    document.querySelector('body').appendChild(videoElement);
    videoElement.hidden = true;
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    hands.onResults(onResults);

    camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        audio: false,
        width: 1280,
        height: 720,
        deviceId: _deviceId
    });
    stream = camera.start();

}

function stopMediaPipeHands() {
    if (document.querySelector('video')) {
        let stream = videoElement.srcObject;
        window.cancelAnimationFrame(id_callback_camera_utils);
        stream.getTracks().forEach(track => track.stop())
        hands.close();
        videoElement.remove();
    }
    g_landmarks = [];
    draw();

}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function showDevices() {
    navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
            devices.forEach(function (device) {
                console.log(device.kind + ": " + device.label +
                    " id = " + device.deviceId);
            });
            return devices;
        })
        .catch(function (err) {
            console.log(err.name + ": " + err.message);
        });
}