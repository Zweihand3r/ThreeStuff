/*
params = {
    planeWidth: 40,
    planeHeight: 40,
    backgroundColor: 'black',
    enableOrbitControls: false,
    FLAGS: ["humanRef"] // Not implemented yet
}

constructScene() returns { canvas, renderer, scene, gui, cam_world, light_dir }
*/

/* ----------------- Construct ---------------- */

function constructScene(params) {
    let PLANE_WIDTH = 40
    let PLANE_HEIGHT = 40
    let BACKGROUND_COLOR = 'rgb(88%, 88%, 88%)'
    let ENABLE_ORBIT_CONTROLS = false

    if (params != undefined) {
        if (params.planeWidth != undefined) PLANE_WIDTH = params.planeWidth
        if (params.planeHeight != undefined) PLANE_HEIGHT = params.planeHeight
        if (params.backgroundColor != undefined) BACKGROUND_COLOR = params.backgroundColor
        if (params.enableOrbitControls != undefined) ENABLE_ORBIT_CONTROLS = params.enableOrbitControls
    }

    const canvas = document.querySelector('#canvas')

    const renderer = new THREE.WebGLRenderer({ canvas })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true

    const cam_world = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cam_world.position.set(0, 10, 20)

    if (ENABLE_ORBIT_CONTROLS) {
        const orbitControls = new THREE.OrbitControls(cam_world, canvas)
        orbitControls.target.set(0, 5, 0)
        orbitControls.update()
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(BACKGROUND_COLOR)

    const gui = new dat.GUI()

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

    const light_amb = new THREE.AmbientLight(0xffffff, .2)
    scene.add(light_amb)

    const light_dir = new THREE.DirectionalLight(0xffffff, .8)
    light_dir.castShadow = true
    light_dir.position.set(0, 10, 0)
    light_dir.target.position.set(4, 0, 4)
    light_dir.shadow.mapSize.width = 2048
    light_dir.shadow.mapSize.height = 2048

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

    return { canvas, renderer, scene, gui, cam_world, light_dir, light_amb }
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
        case 'KeyW': if (!key_up) key_up = true; break
        case 'KeyS': if (!key_down) key_down = true; break
        case 'KeyA': if (!key_left) key_left = true; break
        case 'KeyD': if (!key_right) key_right = true; break
    }
}

function keyUp(e) {
    switch (e.code) {
        case 'KeyW': if (key_up) key_up = false; break
        case 'KeyS': if (key_down) key_down = false; break
        case 'KeyA': if (key_left) key_left = false; break
        case 'KeyD': if (key_right) key_right = false; break
    }
}