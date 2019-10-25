/*
params = {
    planeSize: 40,
    backgroundColor: 'black',
    enableOrbitControls: false
}

constructScene() returns { canvas, renderer, scene, gui, cam_world, light_dir }
*/

/* ----------------- Construct ---------------- */

function constructScene(params) {
    let PLANE_SIZE = 40
    let BACKGROUND_COLOR = 'black'
    let ENABLE_ORBIT_CONTROLS = false

    if (params != undefined) {
        if (params.planeSize != undefined) PLANE_SIZE = params.planeSize
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
        const texture = loader.load('../../assets/images/checker.png')
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.magFilter = THREE.NearestFilter

        const repeats = PLANE_SIZE / 2
        texture.repeat.set(repeats, repeats)

        const mesh = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(PLANE_SIZE, PLANE_SIZE), 
            new THREE.MeshPhongMaterial({ map: texture })
        )
        mesh.receiveShadow = true
        mesh.rotation.x = Math.PI * -.5
        scene.add(mesh)
    }

    {
        const light = new THREE.AmbientLight(0xffffff, .2)
        scene.add(light)
    }

    const light_dir = new THREE.DirectionalLight(0xffffff, .8)
    light_dir.castShadow = true
    light_dir.position.set(0, 10, 0)
    light_dir.target.position.set(-4, 0, -4)
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

    return { canvas, renderer, scene, gui, cam_world, light_dir }
}

/* ----------------- Helpers ---------------- */

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