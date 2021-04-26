
var canvas;
var engine;
var scene;
var Zpression = false;
var Spression = false;
var Qpression = false;
var Dpression = false;
window.onload = connectToServer;

var socket;
var Game = {};
var Joueurs = {};

function connectToServer() {
    socket = io.connect("http://localhost:5000", { transports: ['websocket'], upgrade: false });
    socket.on("connect", function () {
        console.log("connexion etablie");

        socket.on("ID", function (data) {
            Game.id = data.id;
            startGame();

            socket.emit("heartbeat", {});
        });

        socket.on("Ajout", function (data) {
            createTank(scene, data);
        });

        socket.on("JoueurBouge", function (data) {
            var tank = Joueurs[data.id];
            tank.setState(data);

        });

        window.onbeforeunload = function () {
            socket.emit("DeconnexionJoueur", Game.id);
            socket.disconnect();
        }

        socket.on("JoueurQuitte", function (data) {

            var tank = Joueurs[data.id];
            tank.dispose();
            delete Joueurs[data.id];

        });

    });
}

function startGame() {
    canvas = document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(canvas, true);

    scene = createScene();
    scene.enablePhysics();
    //CreateSkyBox(scene);
    loadCrossHair(scene);
    modifySettings();
    var tank = scene.getMeshByName("HeroTank");
    var toRender = function () {
        tank.move();
        scene.render();
    }
    engine.runRenderLoop(toRender);
}

var createScene = function () {

    var scene = new BABYLON.Scene(engine);
    var ground = CreateGround(scene);
    var freeCamera = createFreeCamera(scene);
    var tank = createTank(scene);
    var followCamera = createFollowCamera(scene, tank);
    scene.activeCamera = followCamera;
    createLights(scene);
    // Skybox
	var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", 52.5, scene);
	var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
	skyboxMaterial.backFaceCulling = false;
	skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("images/skybox", scene);
	skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
	skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	skybox.material = skyboxMaterial;
    return scene;
};

function CreateGround(scene) {
    const groundOptions = { width: 2000, height: 2000, subdivisions: 20, minHeight: 0, maxHeight: 100, onReady: onGroundCreated };
    //scene is optional and defaults to the current scene
    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("gdhm", 'images/hmap1.png', groundOptions, scene);



    function onGroundCreated() {
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("images/grass.jpg");
        ground.material = groundMaterial;
        // to be taken into account by collision detection
        ground.checkCollisions = true;
        //groundMaterial.wireframe=true;
    }
    return ground;
}

function tir(scene, crossHair, tank) {

    var puissance = 1;
    var vecteurDeTir = crossHair.getAbsolutePosition().add(tank.getAbsolutePosition());

    var balle = BABYLON.MeshBuilder.CreateSphere("balle", { segments: 3, diameter: 1 }, scene);
    balle.physicsImpostor = new BABYLON.PhysicsImpostor(balle, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0.1, friction: 0.5, restition: 0.3 }, scene);
    balle.physicsImpostor.applyImpulse(vecteurDeTir.scale(puissance), tank.getAbsolutePosition());





};

function loadCrossHair(scene) {
    let camera = scene.activeCamera;
    var crossHair = new BABYLON.Mesh.CreateBox("crossHair", .1, scene);
    crossHair.parent = camera;

    crossHair.position.z += 2;
    crossHair.position.y = 0.5;

    crossHair.material = new BABYLON.StandardMaterial("crossHair", scene);
    crossHair.material.diffuseTexture = new BABYLON.Texture("images/gunaims.png", scene);
    crossHair.material.diffuseTexture.hasAlpha = true;
    crossHair.isPickable = false;
    return crossHair;
}

function createLights(scene) {
    let light0 = new BABYLON.DirectionalLight("dir0", new BABYLON.Vector3(-1, -1, 0), scene);

}
function createFreeCamera(scene) {
    var camera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas);
    camera.position.y = 50;
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.keysUp.push('z'.charCodeAt(0));
    camera.keysUp.push('Z'.charCodeAt(0));
    camera.keysDown.push('s'.charCodeAt(0));
    camera.keysDown.push('S'.charCodeAt(0));
    camera.keysRight.push('d'.charCodeAt(0));
    camera.keysRight.push('D'.charCodeAt(0));
    camera.keysLeft.push('q'.charCodeAt(0));
    camera.keysLeft.push('Q'.charCodeAt(0));

    return camera;
}

function createFollowCamera(scene, target) {
    var camera = new BABYLON.FollowCamera("tankFollowCamera", target.position, scene, target);
    camera.radius = 20; // how far from the object to follow
    camera.heightOffset = 4; // how high above the object to place the camera
    camera.rotationOffset = 180; // the viewing angle
    camera.cameraAcceleration = .1; // how fast to move
    camera.maxCameraSpeed = 5; // speed limit
    return camera;
}
function createTank(scene, data) {
    var tank = new BABYLON.MeshBuilder.CreateBox("HeroTank", { height: 1, depth: 6, width: 6 }, scene);
    var tankMaterial = new BABYLON.StandardMaterial("tankMaterial", scene);
    tankMaterial.diffuseColor = new BABYLON.Color3.Red;
    tankMaterial.emissiveColor = new BABYLON.Color3.Blue;
    tank.material = tankMaterial;
    tank.position.y += 2;
    tank.speed = 1;
    tank.frontVector = new BABYLON.Vector3(0, 0, 1);
    tank.state = {
        id: Game.id,
        x: tank.position.x,
        y: tank.position.y,
        z: tank.position.z,
        rX: tank.rotation.x,
        rY: tank.rotation.y,
        rZ: tank.rotation.z
    }
    tank.setState = function (data) {
        tank.position.x = data.x;
        tank.position.y = data.y;
        tank.position.z = data.z;
        tank.rotation.x = data.rX;
        tank.rotation.y = data.rY;
        tank.rotation.z = data.rZ;
    }

    if (data) {
        tankMaterial.diffuseColor = new BABYLON.Color3.Yellow;
        tankMaterial.emissiveColor = new BABYLON.Color3.Yellow;
        Joueurs[data.id] = tank;
        tank.setState(data);
    }
    else {
        socket.emit("Creation", tank.state);
    }
    tank.move = function () {
        var notifyServer = false;
        var yMovement = 0;
        if (tank.position.y > 2) {
            tank.moveWithCollisions(new BABYLON.Vector3(0, -2, 0));
            notifyServer = true;
        }

        if (Zpression) {
            tank.moveWithCollisions(tank.frontVector.multiplyByFloats(tank.speed, tank.speed, tank.speed));
            notifyServer = true;
        }
        if (Spression) {
            tank.moveWithCollisions(tank.frontVector.multiplyByFloats(-1 * tank.speed, -1 * tank.speed, -1 * tank.speed));
            notifyServer = true;
        }
        if (Qpression) {
            tank.rotation.y -= .1;
            tank.frontVector = new BABYLON.Vector3(Math.sin(tank.rotation.y), 0, Math.cos(tank.rotation.y))
            notifyServer = true;
        }
        if (Dpression) {
            tank.rotation.y += .1;
            tank.frontVector = new BABYLON.Vector3(Math.sin(tank.rotation.y), 0, Math.cos(tank.rotation.y))
            notifyServer = true;
        }

        if (notifyServer) {
            tank.state.x = tank.position.x;
            tank.state.y = tank.position.y;
            tank.state.z = tank.position.z;
            tank.state.rX = tank.rotation.x;
            tank.state.rY = tank.rotation.y;
            tank.state.rZ = tank.rotation.z;
            socket.emit("JeBouge", tank.state);
        }

    }
    return tank;
}
window.addEventListener("resize", function () {
    engine.resize();
});

function modifySettings() {
    scene.onPointerDown = function () {
        if (!scene.alreadyLocked) {
            console.log("verrouillage necessaire");
            canvas.requestPointerLock = canvas.requestPointerLock ||
                canvas.msRequestPointerLock || canvas.mozRequestPointerLock ||
                canvas.webkitRequestPointerLock;
            canvas.requestPointerLock();
        }
        else {
            console.log("déjà verrouillé");
        }
    }

    document.addEventListener("pointerlockchange", pointerLockListener);
    document.addEventListener("mspointerlockchange", pointerLockListener);
    document.addEventListener("mozpointerlockchange", pointerLockListener);
    document.addEventListener("webkitpointerlockchange", pointerLockListener);

    function pointerLockListener() {
        var element = document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement || document.pointerLockElement || null;

        if (element) {
            scene.alreadyLocked = true;
        }
        else {
            scene.alreadyLocked = false;
        }
    }

}




document.addEventListener("keydown", function (event) {
    if (event.keyCode === 32) {
        tir(scene, loadCrossHair(scene), createTank(scene));
    }
    if (event.key == 'z' || event.key == 'Z') {
        Zpression = true;
    }
    if (event.key == 's' || event.key == 'S') {
        Spression = true;
    }
    if (event.key == 'Q' || event.key == 'q') {
        Qpression = true;
    }
    if (event.key == 'd' || event.key == 'D') {
        Dpression = true;
    }

});

document.addEventListener("keyup", function (event) {
    if (event.key == 'z' || event.key == 'Z') {
        Zpression = false;
    }
    if (event.key == 's' || event.key == 'S') {
        Spression = false;
    }
    if (event.key == 'q' || event.key == 'Q') {
        Qpression = false;
    }
    if (event.key == 'd' || event.key == 'D') {
        Dpression = false;
    }

});
