class Ball extends THREE.Object3D {

    boundaries = []

    rollSpeed_OFFSET = .1

    cam_overhead_OFFSET = new THREE.Vector3(0, 10, -7.5)

    constructor(planeSize, gui) {
        super()

        const controls = {
            color: 0xffffff,
            flatShading: true,

            debug: {
                "showBounds": false
            }
        }

        const boundsHelpers = []

        /* BALL */

        const mat = new THREE.MeshStandardMaterial({ color: controls.color })
        const geo = new THREE.SphereGeometry(.5, 32, 32)

        geo.vertices.forEach(vert => {
            if (vert.y > -.005 && vert.y < .005) {
                vert.set(0, vert.y, 0)
            }
        })

        mat.flatShading = true
        mat.metalness = .6
        mat.roughness = .15

        this.body = new THREE.Object3D()
        this.body.position.y = .5
        this.add(this.body)

        this.pivot = new THREE.Object3D()
        this.body.add(this.pivot)

        const sphere = new THREE.Mesh(geo, mat)
        sphere.castShadow = true
        this.pivot.add(sphere)

        const stripeRadius = .44

        const stripeGeo = new THREE.CylinderBufferGeometry(stripeRadius, stripeRadius, .1, 32)
        const stripeMat = new THREE.MeshPhongMaterial({ color: controls.color })
        stripeMat.emissive = new THREE.Color(controls.color)
        
        const stripe = new THREE.Mesh(stripeGeo, stripeMat)
        this.pivot.add(stripe)

        const stripeLight = new THREE.PointLight(controls.color, 1)
        stripeLight.castShadow = true
        stripeLight.decay = 2
        stripeLight.shadow.camera.near = .1
        this.pivot.add(stripeLight)

        const ambientLight = new THREE.PointLight(controls.color, .25)
        this.pivot.add(ambientLight)

        this.boundsBox = new THREE.Mesh(new THREE.BoxBufferGeometry())
        this.boundsBox.visible = false
        this.body.add(this.boundsBox)

        this.boundsBox3 = new THREE.Box3(new THREE.Vector3(-.5, -.5, -.5), new THREE.Vector3(.5, .5, .5))

        const boundsBoxHelper = new THREE.Box3Helper(this.boundsBox3, 0x0000ff)
        boundsBoxHelper.visible = controls.debug.showBounds
        this.add(boundsBoxHelper)
        boundsHelpers.push(boundsBoxHelper)


        /* ENVIRONMENT */

        const boundaries_data = [
            { size: [.25, 1.1, planeSize], position: [planeSize / 2, .5, 0] },
            { size: [.25, 1.1, planeSize], position: [-planeSize / 2, .5, 0] },
            { size: [planeSize, 1.1, .25], position: [0, .5, planeSize / 2] },
            { size: [planeSize, 1.1, .25], position: [0, .5, -planeSize / 2] }
        ]

        const boundsMat = new THREE.MeshPhongMaterial({ color: 0xffffff })

        boundaries_data.forEach(data => {
            const geo = new THREE.BoxBufferGeometry(...data.size)
            const box = new THREE.Mesh(geo, boundsMat)
            box.position.set(...data.position)
            box.receiveShadow = true
            box.castShadow = true
            this.add(box)

            const box3 = new THREE.Box3()
            box.geometry.computeBoundingBox()

            this.boundaries.push({ mesh: box, box3: box3 })

            const box3Helper = new THREE.Box3Helper(box3, 0xff0000)
            box3Helper.visible = controls.debug.showBounds
            this.add(box3Helper)
            boundsHelpers.push(box3Helper)
        })


        /* GUI */

        const folder = gui.addFolder("BALL CONTROLS")
        folder.addColor(controls, "color").name("Color").onChange(updateColor)
        folder.add(controls, "flatShading").name("Flat Shading").onChange(function() {
            mat.needsUpdate = true
            mat.flatShading = controls.flatShading
        })
        folder.open()

        function updateColor() {
            const color = new THREE.Color(controls.color)

            mat.color.set(color)

            stripeMat.color.set(color)
            stripeMat.emissive = color

            stripeLight.color = color
            ambientLight.color = color
        }

        const debugFolder = folder.addFolder("Debug")
        debugFolder.add(controls.debug, "showBounds").name("Show Bounds").onChange(function(value) {
            boundsHelpers.forEach(helper => {
                helper.visible = value
            })
        })


        /* ----------------- Cameras ---------------- */

        this.cam_overhead = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, .1, 1000)
        this.cam_overhead.rotation.set = (0, Math.PI, 0)
        this.cam_overhead.position.add(this.cam_overhead_OFFSET)


        /* ---------------- Controls ---------------- */

        this.axisZ = 0
        this.axisX = 0

        this.speedZ = 0
        this.speedX = 0

        this.speed_ACTUAL = 0
    }

    enableControls() { this.controlsEnabled = true }
    disableControls() { this.controlsEnabled = false }

    update(time) {
        /* Bounds calculations should be performed first */
        this._updateBounds()

        if (this.controlsEnabled) {

            if (key_up) this.axisZ = 1
            else if (key_down) this.axisZ = -1
            else this.axisZ = 0

            if (key_left) this.axisX = 1
            else if (key_right) this.axisX = -1
            else this.axisX = 0

        }

        const deltaSpeed = this.axisZ != 0 || this.axisX != 0 ? .025 : .001

        if (this.speedZ < this.axisZ) {
            this.speedZ = Math.min(this.speedZ + deltaSpeed, this.axisZ)
        } else {
            this.speedZ = Math.max(this.speedZ - deltaSpeed, this.axisZ)
        }

        if (this.speedX < this.axisX) {
            this.speedX = Math.min(this.speedX + deltaSpeed, this.axisX)
        } else {
            this.speedX = Math.max(this.speedX - deltaSpeed, this.axisX)
        }

        this._boundsCalculations()

        this.speed_ACTUAL = Math.max(Math.abs(this.speedZ), Math.abs(this.speedX))

        this.body.position.z += this.speedZ * .075
        this.body.position.x += this.speedX * .075

        const rollAxis = new THREE.Vector3(this.speedZ, 0, -this.speedX).normalize()
        this.pivot.rotateOnWorldAxis(rollAxis, this.speed_ACTUAL * this.rollSpeed_OFFSET)

        /* Cam */
        const updatedPos = new THREE.Vector3().copy(this.body.position).add(this.cam_overhead_OFFSET)
        this.cam_overhead.position.lerp(updatedPos, .01)
        this.cam_overhead.lookAt(this.body.position)
    }

    _updateBounds() {
        this.boundsBox.geometry.computeBoundingBox()
        this.boundsBox3.copy(this.boundsBox.geometry.boundingBox).applyMatrix4(this.boundsBox.matrixWorld)

        this.boundaries.forEach(data => {
            data.box3.copy(data.mesh.geometry.boundingBox).applyMatrix4(data.mesh.matrixWorld)
        })
    }

    _boundsCalculations() {
        this.boundaries.forEach((data, index) => {
            if (this.boundsBox3.intersectsBox(data.box3)) {
                if (Math.abs(data.mesh.position.z) > Math.abs(data.mesh.position.x)) {
                    this.speedZ *= -1
                } else this.speedX *= -1
            }
        })
    }
}