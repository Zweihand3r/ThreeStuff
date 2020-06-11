const canvas = document.querySelector('#canvas')

const renderer = new THREE.WebGLRenderer({ canvas })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true

const cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
cam.position.set(0, 0, 120)

const scene = new THREE.Scene()
scene.background = new THREE.Color('rgb(4%, 4%, 4%)')

const gui = new dat.GUI()

/* Scene setup done */

const central_HEX = 0xffddaa

const central_RADIUS = 10
const pivot_COUNT = 5
const cube_SIZE = 5
const cube_COUNT = 50

const ambientLight = new THREE.AmbientLight(central_HEX, .2)
scene.add(ambientLight)

const centralGeo = new THREE.SphereBufferGeometry(central_RADIUS, 32, 32)
const centralMat = new THREE.MeshPhongMaterial({ color: central_HEX })
centralMat.emissive = new THREE.Color(0xffffff)

const central = new THREE.Mesh(centralGeo, centralMat)
scene.add(central)

const centralLight = new THREE.PointLight(central_HEX, 1.8)
centralLight.castShadow = true
centralLight.decay = 0
scene.add(centralLight)


/* Light */

const lensLight = new THREE.PointLight(central_HEX, 1)
lensLight.position.set(0, 0, central_RADIUS + .1)
scene.add(lensLight)

/* Lens Flare */

const texLoader = new THREE.TextureLoader()
const texFlare0 = texLoader.load('./assets/textures/lensflare/lensflare0.png')
const texFlare3 = texLoader.load('./assets/textures/lensflare/lensflare3.png')

const lensFlare = new THREE.Lensflare()
lensFlare.addElement(new THREE.LensflareElement(texFlare0, 700, 0, lensLight.color))
lensFlare.addElement(new THREE.LensflareElement(texFlare3, 60, .6))
lensLight.add(lensFlare)


let pivots = []
for (let i = 0; i < pivot_COUNT; i++) {
    let pivot = new THREE.Object3D()
    scene.add(pivot)
    pivots.push(pivot)
}

let cubes = []
const cubeGeo = new THREE.BoxBufferGeometry(cube_SIZE, cube_SIZE, cube_SIZE)
const cubeMat = new THREE.MeshPhongMaterial({ color: 0xffffff })
for (let i = 0; i < cube_COUNT; i++) {
    const cube = new THREE.Mesh(cubeGeo, cubeMat)
    cube.position.set(
        Math.random() * 200 - 100,
        Math.random() * 40 - 20,
        Math.random() * 200 - 100
    )

    cube.castShadow = true
    cube.receiveShadow = true

    const pivotIndex = Math.floor(Math.random() * pivot_COUNT)
    pivots[pivotIndex].add(cube)
    cubes.push(cube)
}


/* --- RENDER LOOP --- */

requestAnimationFrame(render)

function render(time) {
    requestAnimationFrame(render)

    central.rotation.y = time * .0001

    pivots.forEach((pivot, index) => {
        pivot.rotation.y = time * .00002 * (index + 1)
    })

    cubes.forEach((cube, index) => {
        cube.rotation.x = time * .0001 + index
        cube.rotation.y = time * .0001 + index
        cube.rotation.z = time * .0001 + index
    })

    renderer.render(scene, cam)
}