const PLANE_SIZE = 40
const CREATE_PLACEHOLDER_CUBE = true

const { canvas, renderer, scene, gui, cam_world } = init()

function render(time) {
    renderer.render(scene, cam_world)

    requestAnimationFrame(render)
}

requestAnimationFrame(render)


/* -------------- Init -------------- */

function init() {
    const canvas = document.querySelector('#canvas')

    const renderer = new THREE.WebGLRenderer({ canvas })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true

    const cam_world = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cam_world.position.set(0, 10, 20)

    const orbitControls = new THREE.OrbitControls(cam_world, canvas)
    orbitControls.target.set(0, 5, 0)
    orbitControls.update()

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('black')

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

    {
        const light = new THREE.DirectionalLight(0xffffff, .8)
        light.castShadow = true
        light.position.set(0, 10, 0)
        light.target.position.set(-4, 0, -4)
        light.shadow.mapSize.width = 2048
        light.shadow.mapSize.height = 2048

        scene.add(light)
        scene.add(light.target)

        const d = 50
        light.shadow.camera.left = -d
        light.shadow.camera.right = d
        light.shadow.camera.top = d
        light.shadow.camera.bottom = -d
        light.shadow.camera.near = 1
        light.shadow.camera.far = 50
        light.shadow.bias = 0.001
    }

    {
        if (CREATE_PLACEHOLDER_CUBE) {
            const mesh = new THREE.Mesh(
                new THREE.BoxBufferGeometry(1, 1, 1),
                new THREE.MeshPhongMaterial({ color: '#8AC' })
            )
            mesh.castShadow = true
            mesh.position.y = .5
            scene.add(mesh)
        }
    }

    return { canvas, renderer, scene, gui, cam_world }
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