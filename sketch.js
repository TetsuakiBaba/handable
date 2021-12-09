var g_landmarks = [];
var g_angles = [];
var is_enable_gesture = false;
var is_pinched = false;
var dollar;

var is_dollar_active = false;
var is_pose_active = false;
var time_stamp_pose_active;
var time_stamp_pose_deactive;
var ms_operation_activate = 1000;
var angles_gesturing = [151.0232640949309, 145.089203018993, 144.16041218595345, 169.68865560150968, 177.15161107874442, 175.53394799584137, 173.98758495731641, 179.36823806450363, 174.9455227261207, 164.41700628951898, 26.185195501561566, 169.24322576395195, 155.01530489937826, 38.58580456701814, 168.6758256467776];


// ここからMediaPipeの記述
function onResults(results) {
    if (results.multiHandLandmarks) {
        g_landmarks = [];
        g_angles = [];
        for (const landmarks of results.multiHandLandmarks) {
            g_landmarks.push(landmarks);
        }
        //console.log(results.multiHandness[0].Left);
        // ハンドジェスチャ認識処理はこのタイミングがよいと思う
        for (landmarks of g_landmarks) {

            let pos_fingers = [
                [0, 1, 2, 3, 4],
                [0, 5, 6, 7, 8],
                [0, 9, 10, 11, 12],
                [0, 13, 14, 15, 16],
                [0, 17, 18, 19, 20]
            ];
            // 各関節角度を計算して g_angles に保存
            let index = 0;
            for (pos_finger of pos_fingers) {
                let v1 = createVector(
                    landmarks[pos_finger[0]].x - landmarks[pos_finger[1]].x,
                    landmarks[pos_finger[0]].y - landmarks[pos_finger[1]].y,
                    landmarks[pos_finger[0]].z - landmarks[pos_finger[1]].z);
                let v2 = createVector(
                    landmarks[pos_finger[2]].x - landmarks[pos_finger[1]].x,
                    landmarks[pos_finger[2]].y - landmarks[pos_finger[1]].y,
                    landmarks[pos_finger[2]].z - landmarks[pos_finger[1]].z);
                let v3 = createVector(
                    landmarks[pos_finger[1]].x - landmarks[pos_finger[2]].x,
                    landmarks[pos_finger[1]].y - landmarks[pos_finger[2]].y,
                    landmarks[pos_finger[1]].z - landmarks[pos_finger[2]].z);
                let v4 = createVector(
                    landmarks[pos_finger[3]].x - landmarks[pos_finger[2]].x,
                    landmarks[pos_finger[3]].y - landmarks[pos_finger[2]].y,
                    landmarks[pos_finger[3]].z - landmarks[pos_finger[2]].z);

                let v5 = createVector(
                    landmarks[pos_finger[2]].x - landmarks[pos_finger[3]].x,
                    landmarks[pos_finger[2]].y - landmarks[pos_finger[3]].y,
                    landmarks[pos_finger[2]].z - landmarks[pos_finger[3]].z);
                let v6 = createVector(
                    landmarks[pos_finger[4]].x - landmarks[pos_finger[3]].x,
                    landmarks[pos_finger[4]].y - landmarks[pos_finger[3]].y,
                    landmarks[pos_finger[4]].z - landmarks[pos_finger[3]].z);
                g_angles.push(abs(degrees(v1.angleBetween(v2))));
                g_angles.push(abs(degrees(v3.angleBetween(v4))));
                g_angles.push(abs(degrees(v5.angleBetween(v6))));
            }


            // pose_gesturing との比較
            if (g_angles.length == 15) {
                let d_sum = 0;
                for (let pos = 0; pos < g_angles.length; pos++) {
                    d_sum += pow(g_angles[pos] - angles_gesturing[pos], 2);
                }
                d_sum = sqrt(d_sum);
                //console.log(d_sum);
                if (d_sum < 100) {
                    if (is_pose_active == false) {
                        is_pose_active = true;
                        timestamp_pose_active = millis();
                    }
                }
                else {
                    is_pose_active = false;
                    timestamp_pose_deactive = millis();
                }
            }



            let distance_4to8 = dist(
                landmarks[4].x, landmarks[4].y, landmarks[4].z,
                landmarks[8].x, landmarks[8].y, landmarks[8].z);

            if (distance_4to8 < 0.05) {
                if (is_pinched == false) {
                    (async () => {
                        const message = await window.myapi.down({
                            x: width * (1.0 - (landmarks[4].x + (landmarks[8].x - landmarks[4].x) / 2)),
                            y: height * (landmarks[4].y + (landmarks[8].y - landmarks[4].y) / 2)
                        })
                    })()
                }
                else {
                    (async () => {
                        const message = await window.myapi.drag({
                            x: width * (1.0 - (landmarks[4].x + (landmarks[8].x - landmarks[4].x) / 2)),
                            y: height * (landmarks[4].y + (landmarks[8].y - landmarks[4].y) / 2)
                        })
                    })()
                }
                is_pinched = true;
            }
            else {
                if (is_pinched == true) {
                    (async () => {
                        const message = await window.myapi.up({
                            x: width * (1.0 - (landmarks[4].x + (landmarks[8].x - landmarks[4].x) / 2)),
                            y: height * (landmarks[4].y + (landmarks[8].y - landmarks[4].y) / 2)
                        })
                    })()
                }
                is_pinched = false;
            }
        }

    }
    draw();
}

// ここまでMediaPipeの記述

var camera;
var video;
var cam;


function startCamera() {
    startMediaPipeHands('8ce8e876fe1196ef2fdff50084325a364d50628dc4f98bd938e163efed58a6cf');
}

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

    //startCamera();
    dollar = DollarRecognizer();
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

            noFill();
            stroke(0, 200);
            for (array_point of array_points) {
                strokeWeight(width / 100);
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

            // let ps = [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 19];
            // let count = 0;
            // for (p of ps) {
            //     noFill();
            //     strokeWeight(1.0);
            //     stroke(0, 150, 0);
            //     text(nf(g_angles[count], 1, 2),
            //         width * (1.0 - landmarks[p].x),
            //         height * (landmarks[p].y));
            //     count++;
            // }


            if (is_enable_gesture) {
                if (is_pinched) {
                    noStroke();
                    fill(255, 0, 0, 200);
                    circle(
                        width * (1.0 - (landmarks[4].x + (landmarks[8].x - landmarks[4].x) / 2)),
                        height * (landmarks[4].y + (landmarks[8].y - landmarks[4].y) / 2),
                        50);
                }
            }
            if (is_dollar_active) {
                noStroke();
                fill(255, 0, 0, 200);
                circle(
                    width * (1.0 - (landmarks[12].x + (landmarks[8].x - landmarks[12].x) / 2)),
                    height * (landmarks[12].y + (landmarks[8].y - landmarks[12].y) / 2),
                    50);
            }

            if (is_pose_active) {
                noStroke();
                fill(150, 0, 0, 150);
                let my_x = width * (1.0 - (landmarks[12].x + (landmarks[8].x - landmarks[12].x) / 2));
                let my_y = height * (landmarks[12].y + (landmarks[8].y - landmarks[12].y) / 2);
                arc(width * (1.0 - (landmarks[12].x + (landmarks[8].x - landmarks[12].x) / 2)),
                    height * (landmarks[12].y + (landmarks[8].y - landmarks[12].y) / 2),
                    80, 80,
                    0,
                    TWO_PI * ((millis() - timestamp_pose_active) / ms_operation_activate),
                    PIE);
                if ((millis() - timestamp_pose_active) / ms_operation_activate > 1.0) {
                    //console.log("clicked");
                    is_pose_active = false;
                    (async () => {
                        if (my_x < width / 2) {
                            const message = await window.myapi.pressKey({
                                kind: 'left'
                            })
                            message = await window.myapi.releaseKey({
                                kind: 'left'
                            })
                        }
                        else {
                            const message = await window.myapi.pressKey({
                                kind: 'right'
                            })
                            message = await window.myapi.releaseKey({
                                kind: 'right'
                            })
                        }
                    })()

                }
                //text(millis() - timestamp_pose_active, width / 2, height / 2);
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
        console.log(g_angles);
    }
    // if (key == 's') {
    //     startMediaPipeHands();
    // }
    // else if (key == 'c') {
    //     stopMediaPipeHands();
    // }

    // console.log(document.querySelector('body'));

}

function toggleFingerGesture(_enable_gesture) {
    is_enable_gesture = _enable_gesture;
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


