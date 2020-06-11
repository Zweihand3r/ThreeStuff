/*
params = {
    planeWidth: 40,
    planeHeight: 40,
    backgroundColor: 'black',
    shadowMapSizeMult: 2,
    flags: [
        "ORBIT_CONTROLS" - Add to enable orbit controls for cam_world
        "DAYNIGHT_CYCLE" - Adds day/night cycle controls
        "HUMAN_REF" - Not implemented yet
    ]
}

constructScene() returns { canvas, renderer, scene, gui, cam_world, light_dir }

constructScene() also starts the render loop
- Use render cam to assign desired camera
- Use update to receives render updates
*/

/* ----------------- Construct ---------------- */

let renderCam
let update = function(time) {}

const scene_controls = {
    isDaytime: "1"
}

function constructScene(params) {
    let PLANE_WIDTH = 40
    let PLANE_HEIGHT = 40
    let BACKGROUND_COLOR = 'rgb(88%, 88%, 88%)'
    let SHADOW_MAP_SIZE_MULT = 2
    let ENABLE_ORBIT_CONTROLS = false
    let ENABLE_DAYNIGHT_CYCLE = false

    if (params != undefined) {
        if (params.planeWidth != undefined) PLANE_WIDTH = params.planeWidth
        if (params.planeHeight != undefined) PLANE_HEIGHT = params.planeHeight
        if (params.backgroundColor != undefined) BACKGROUND_COLOR = params.backgroundColor
        if (params.shadowMapSizeMult != undefined) SHADOW_MAP_SIZE_MULT = params.shadowMapSizeMult

        if (params.flags != undefined) {
            params.flags.forEach(flag => {
                switch (flag) {
                    case "ORBIT_CONTROLS": ENABLE_ORBIT_CONTROLS = true; break
                    case "DAYNIGHT_CYCLE": ENABLE_DAYNIGHT_CYCLE = true; break
                }
            })
        }
    }

    const canvas = document.querySelector('#canvas')

    const renderer = new THREE.WebGLRenderer({ canvas })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.physicallyCorrectLights = true
    renderer.shadowMap.enabled = true

    const cam_world = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cam_world.position.set(0, 10, 20)
    renderCam = cam_world

    if (ENABLE_ORBIT_CONTROLS) {
        const orbitControls = new THREE.OrbitControls(cam_world, canvas)
        orbitControls.target.set(0, 5, 0)
        orbitControls.update()
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(BACKGROUND_COLOR)

    const gui = new dat.GUI()
    const folder_scene = gui.addFolder("SCENE CONTROLS")

    {
        const loader = new THREE.TextureLoader()
        const texture = loader.load('../assets/images/checker.png')
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.magFilter = THREE.NearestFilter
        texture.repeat.set(PLANE_WIDTH / 2, PLANE_HEIGHT / 2)

        const mesh = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(PLANE_WIDTH, PLANE_HEIGHT), 
            new THREE.MeshPhongMaterial({ map: texture })
        )
        mesh.receiveShadow = true
        mesh.rotation.x = Math.PI * -.5
        scene.add(mesh)
    }

    const { light_amb, light_dir } = initDayNightCycle(scene, SHADOW_MAP_SIZE_MULT)
    if (ENABLE_DAYNIGHT_CYCLE) {
        folder_scene.add(scene_controls, "isDaytime", { Day: 1, Night: 0 }).name("Time")
        _renderActions.push(updateDayNightCycle)
    }

    folder_scene.open()

    requestAnimationFrame(render)

    return { canvas, renderer, scene, gui, cam_world, light_dir, light_amb }
}

/* -------------- Render Loop --------------- */

let _renderActions = []

function render(time) {
    requestAnimationFrame(render)

    _renderActions.forEach(action => {
        action()
    })

    update(time)

    renderer.render(scene, renderCam)
}

/* -------- Follow Directional Light -------- */

let dirLightFollowTarget
const light_dir_OFFSET = new THREE.Vector3(4, 0, 4)

function setupDirLightTarget(target) {
    dirLightFollowTarget = target
    _renderActions.push(updateDirLight)
}

function updateDirLight() {
    light_dir.target.position.copy(dirLightFollowTarget.position)
    light_dir.position.set(
        dirLightFollowTarget.position.x - light_dir_OFFSET.x,
        light_dir.position.y - light_dir_OFFSET.y,
        dirLightFollowTarget.position.z - light_dir_OFFSET.z
    )
}

/* --------------- Day / Night -------------- */

let DayNight_Bg = .88
const DayNight_Bg_MAX = .88
const DayNight_Bg_MIN = .08
const DayNight_Bg_STEP = .04

let DayNight_Dir = 2.6
const DayNight_Dir_MAX = 2.6
const DayNight_Dir_MIN = .4
const DayNight_Dir_STEP = .11

let DayNight_Amb = .4
const DayNight_Amb_MAX = .4
const DayNight_Amb_MIN = .1
const DayNight_Amb_STEP = .015

function initDayNightCycle(scene, shadowMapSizeMult) {
    const light_amb = new THREE.AmbientLight(0xffffff, DayNight_Amb)
    scene.add(light_amb)

    const light_dir = new THREE.DirectionalLight(0xffffff, DayNight_Dir)
    light_dir.castShadow = true
    light_dir.position.set(0, 10, 0)
    light_dir.target.position.set(4, 0, 4)
    light_dir.shadow.mapSize.width = 1024 * shadowMapSizeMult
    light_dir.shadow.mapSize.height = 1024 * shadowMapSizeMult

    scene.add(light_dir)
    scene.add(light_dir.target)

    const d = 50
    light_dir.shadow.camera.left = -d
    light_dir.shadow.camera.right = d
    light_dir.shadow.camera.top = d
    light_dir.shadow.camera.bottom = -d
    light_dir.shadow.camera.near = 1
    light_dir.shadow.camera.far = 50
    light_dir.shadow.bias = 0.001

    return { light_amb, light_dir }
}

function updateDayNightCycle() {
    if (scene_controls.isDaytime == "1") {
        if (DayNight_Bg < DayNight_Bg_MAX) {
            DayNight_Bg = Math.min(DayNight_Bg + DayNight_Bg_STEP, DayNight_Bg_MAX)
        }

        if (DayNight_Dir < DayNight_Dir_MAX) {
            DayNight_Dir = Math.min(DayNight_Dir + DayNight_Dir_STEP, DayNight_Dir_MAX)
        }

        if (DayNight_Amb < DayNight_Amb_MAX) {
            DayNight_Amb = Math.min(DayNight_Amb + DayNight_Amb_STEP, DayNight_Amb_MAX)
        }

    } else if (scene_controls.isDaytime == "0") {
        if (DayNight_Bg > DayNight_Bg_MIN) {
            DayNight_Bg = Math.max(DayNight_Bg - DayNight_Bg_STEP, DayNight_Bg_MIN)
        }

        if (DayNight_Dir > DayNight_Dir_MIN) {
            DayNight_Dir = Math.max(DayNight_Dir - DayNight_Dir_STEP, DayNight_Dir_MIN)
        }

        if (DayNight_Amb > DayNight_Amb_MIN) {
            DayNight_Amb = Math.max(DayNight_Amb - DayNight_Amb_STEP, DayNight_Amb_MIN)
        }
    }

    scene.background = new THREE.Color(DayNight_Bg, DayNight_Bg, DayNight_Bg)

    light_dir.intensity = DayNight_Dir
    light_amb.intensity = DayNight_Amb
}


/* ----------------- Helpers ---------------- */

function createPositionGui(vector3, name, limit = 100, step = 1) {
    const folder = gui.addFolder(name)
    folder.add(vector3, 'x', -limit, limit, step)
    folder.add(vector3, 'y', -limit, limit, step)
    folder.add(vector3, 'z', -limit, limit, step)
    folder.open()
}

function createGridHelper(obj, size = 32, name) {
    const gridHelper = new THREE.GridHelper(size, size)
    obj.add(gridHelper)

    if (name != undefined) { gui.add(gridHelper, 'visible') }
}

function createAxesHelper(obj, size = 1, name) {
    const axesHelper = new THREE.AxesHelper(size)
    axesHelper.material.depthTest = false
    axesHelper.renderOrder = 1
    obj.add(axesHelper)

    if (name != undefined) { gui.add(axesHelper, 'visible') }
}

/* ------------- Keys Listeners ------------ */

let key_up = false
let key_right = false
let key_down = false
let key_left = false

document.addEventListener('keydown', keyDown)
document.addEventListener('keyup', keyUp)

function keyDown(e) {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW': if (!key_up) key_up = true; break

        case 'ArrowDown':
        case 'KeyS': if (!key_down) key_down = true; break

        case 'ArrowLeft':
        case 'KeyA': if (!key_left) key_left = true; break

        case 'ArrowRight':
        case 'KeyD': if (!key_right) key_right = true; break
    }
}

function keyUp(e) {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW': if (key_up) key_up = false; break

        case 'ArrowDown':
        case 'KeyS': if (key_down) key_down = false; break

        case 'ArrowLeft':
        case 'KeyA': if (key_left) key_left = false; break

        case 'ArrowRight':
        case 'KeyD': if (key_right) key_right = false; break
    }
}