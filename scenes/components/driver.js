class Driver extends THREE.Object3D {

    pivots_FWs = []

    lights_front = []
    lightsMat_front = []

    lights_rear = []
    lightsMat_rear = []

    constructor(gui) {
        super()

        /* ------------- Geometry ------------ */
        
        const mat = new THREE.MeshPhongMaterial({ color: 0xae3256 })

        this.body = new THREE.Object3D()
        this.add(this.body)

        const bodyTopGeo = new THREE.Geometry()
        bodyTopGeo.vertices.push(
            new THREE.Vector3(-1, -.25, 1.25), // 0
            new THREE.Vector3(1, -.25, 1.25), // 1
            new THREE.Vector3(-1, .25, .85), // 2
            new THREE.Vector3(1, .25, .85), // 3
            new THREE.Vector3(-1, -.25, -1.25), // 4
            new THREE.Vector3(1, -.25, -1.25), // 5
            new THREE.Vector3(-1, .25, -.9), // 6
            new THREE.Vector3(1, .25, -.9) // 7
        )

        /*
              6---------7
             /|        /|
            2---------3 |
            | |       | |
            | 4-------|-5
            |/        |/
            0---------1
        */    

        bodyTopGeo.faces.push(
            new THREE.Face3(0, 3, 2),
            new THREE.Face3(0, 1, 3),

            new THREE.Face3(1, 7, 3),
            new THREE.Face3(1, 5, 7),

            new THREE.Face3(5, 6, 7),
            new THREE.Face3(5, 4, 6),

            new THREE.Face3(4, 2, 6),
            new THREE.Face3(4, 0, 2),

            new THREE.Face3(2, 7, 6),
            new THREE.Face3(2, 3, 7),

            new THREE.Face3(4, 1, 0),
            new THREE.Face3(4, 5, 1)
        )

        bodyTopGeo.computeFaceNormals()

        const bodyTop = new THREE.Mesh(bodyTopGeo, mat)
        bodyTop.position.set(0, 1.15, -.25)
        bodyTop.castShadow = true
        this.body.add(bodyTop)

        const bodyData = {
            mid: { size: [2, .2, 4], position: [0, .8, 0] },
            bottom: { size: [1.2, .5, 3.2], position: [0, .451, 0] },
            bumper_front: { size: [2, .5, .4], position: [0, .45, 1.8] },
            bumper_rear: { size: [2, .5, .4], position: [0, .45, -1.8] },
            skirt_left: { size: [.4, .5, 1.7], position: [.8, .45, 0] },
            skirt_right: { size: [.4, .5, 1.7], position: [-.8, .45, 0] }
        }

        {
            for (let key in bodyData) {
                const part = bodyData[key]
                
                const geometry = new THREE.BoxBufferGeometry(...part.size)
                const mesh = new THREE.Mesh(geometry, mat)
                mesh.position.set(...part.position)
                mesh.castShadow = true
                this.body.add(mesh)
            }
        }

        const wheelPositions = [
            [.845, .34, 1.23], // FL
            [-.845, .34, 1.23], // FR
            [.845, .34, -1.23], // RL
            [-.845, .34, -1.23] // RR
        ]

        const wheelGeo = new THREE.CylinderBufferGeometry(.34, .34, .3, 8)
        const wheelMat = new THREE.MeshPhongMaterial({ color: 0x343434 })

        this.wheels = []

        wheelPositions.forEach((position, index) => {
            const pivot = new THREE.Object3D()
            pivot.position.set(...position)
            this.add(pivot)

            const wheel = new THREE.Mesh(wheelGeo, wheelMat)
            wheel.rotation.z = Math.PI * .5
            this.wheels.push(wheel)
            pivot.add(wheel)

            if (index < 2) {
                this.pivots_FWs.push(pivot)
            }
        })

        const lightPositions = [
            [.72, .72, 1.965], // FL
            [-.72, .72, 1.965], // FR
            [.72, .72, -1.965], // RL
            [-.72, .72, -1.965] // RR
        ]

        const lightGeo = new THREE.BoxBufferGeometry(.4, .2, .1)

        lightPositions.forEach((position, index) => {
            let mat = new THREE.MeshPhongMaterial({ color: 0xffffff })
            const mesh = new THREE.Mesh(lightGeo, mat)
            mesh.position.set(...position)
            this.add(mesh)

            if (index < 2) {
                const light = new THREE.SpotLight(0xffffff, this.lightsIntensity_MAX)
                light.angle = THREE.Math.degToRad(45)
                light.distance = 1000
                light.position.set(position[0], position[1], 1.55)
                light.target.position.set(position[0], position[1], 10)
                this.add(light)
                this.add(light.target)

                this.lights_front.push(light)
                this.lightsMat_front.push(mat)

                const lightTarget = new THREE.Mesh(
                    new THREE.BoxBufferGeometry(.1, .1, .1),
                    new THREE.MeshBasicMaterial({ color: 0xffffff })
                )

                lightTarget.position.set(position[0], position[1], 10)
                this.add(lightTarget)

                // const helper = new THREE.SpotLightHelper(light)
                // this.add(helper)

                // light.target.updateMatrixWorld()
                // helper.update()
            
            } else {
                // mat.color = 0xff0000

                const light = new THREE.PointLight(0xff0000, 0)
                light.castShadow = true
                light.distance = 10
                light.position.set(position[0], position[1], -2.075)
                this.add(light)

                gui.add(light, 'decay', 0, 2, .1).name('l' + index + '_decay')
                gui.add(light, 'distance', 0, 2, .1).name('l' + index + '_dist')
                gui.add(light, 'intensity', 0, 2, .1).name('l' + index + '_inten')

                this.lights_rear.push(light)
                this.lightsMat_rear.push(mat)

                // const helper = new THREE.PointLightHelper(light)
                // this.add(helper)
            }
        })


        /* -------------- Camera -------------- */

        this.cam_rear = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.add(this.cam_rear)
        this.cam_rear.rotation.set(.3, Math.PI, 0)
        this.cam_rear.position.set(0, 5, -10)

        this.cam_left = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.add(this.cam_left)
        this.cam_left.rotation.set(-Math.PI / 2, Math.PI / 2, Math.PI / 2)
        this.cam_left.position.set(10, 2.5, 0)


        /* ------------- Controls ------------- */

        this.engineOn = true
        this.lightsOn = false

        this.speed = 0
        this.turn = 0

        this.speed_MAX = 5
        this.speedRev_MAX = 2

        this.turn_MAX = .01

        this.accel = .025
        this.decel = .1
        this.friction = 0.005
        
        this.turnStep = .0001
        this.turnReset = .00025

        this.braking = false

        this.lightsIntensity = 0
        this.lightsIntensityStep = 1
        this.lightsIntensity_MAX = 10

        this.rotationIndex = 0
    }

    enableControls() { this.controlsEnabled = true }
    disableControls() { this.controlsEnabled = false }

    update(time) {
        let moveZ = 0
        let moveX = 0

        if (this.controlsEnabled) {
            if (this.engineOn) {
                if (key_up && this.speed < this.speed_MAX && this.speed >= 0) {
                    this.speed = Math.min(this.speed + this.accel, this.speed_MAX)
                }
    
                if (key_down && this.speed > -this.speedRev_MAX && this.speed <= 0) {
                    this.speed = Math.max(this.speed - this.accel, -this.speedRev_MAX)
                }

                if (!key_up && !key_down) {
                    this._neutraliseSpeed()
                }

            } else {
                this._neutraliseSpeed()
            }

            if (key_left && this.turn < this.turn_MAX) {
                const step = this.turn < 0 ? this.turnReset : this.turnStep
                this.turn = Math.min(this.turn + step, this.turn_MAX)
            }

            if (key_right && this.turn > -this.turn_MAX) {
                const step = this.turn > 0 ? this.turnReset : this.turnStep
                this.turn = Math.max(this.turn - step, -this.turn_MAX)
            }

            if (!key_left && !key_right) {
                if (this.turn > 0) {
                    this.turn = Math.max(this.turn - this.turnReset, 0)
                } else if (this.turn < 0) {
                    this.turn = Math.min(this.turn + this.turnReset, 0)
                }
            }

        } else {
            this._neutraliseSpeed()
        }

        if (key_down && this.speed > 0) {
            this.speed = Math.max(this.speed - this.decel, 0)
            this.braking = true
        } else if (key_up && this.speed < 0) {
            this.speed = Math.min(this.speed + this.decel, 0)
            this.braking = true
        } else this.braking = false

        if (this.turn != 0) {
            this.rotation.y += this.turn * this.speed
        }

        if (this.speed != 0) {
            const angle = this.rotation.y

            moveZ = Math.cos(angle) * this.speed
            moveX = Math.sin(angle) * this.speed
        }

        console.log(this.braking)
        
        this.position.z += moveZ * 0.05
        this.position.x += moveX * 0.05

        this.rotationIndex += 10

        this._rotateWheels()
        this._turnWheels()

        this._updateLights()
        this._brakeLights()
    }

    _rotateWheels() {
        this.wheels.forEach((mesh) => {
            mesh.rotation.x += this.speed * .095
        })
    }

    _turnWheels() {
        this.pivots_FWs.forEach((pivot) => {
            pivot.rotation.y = this.turn * 44
        })
    }

    _updateLights() {
        if (this.lightsOn) {
            this.lightsIntensity = Math.min(this.lightsIntensity + this.lightsIntensityStep, this.lightsIntensity_MAX)
        } else {
            this.lightsIntensity = Math.max(this.lightsIntensity - this.lightsIntensityStep, 0)
        }

        this.lights_front.forEach((light) => {
            light.intensity = this.lightsIntensity
        })
    }

    _brakeLights() {
        const intensity = this.braking ? 1 : 0

        this.lights_rear.forEach((light) => {
            light.intensity = intensity
        })
    }

    _neutraliseSpeed() {
        if (this.speed > 0) this.speed = Math.max(this.speed - this.friction, 0)
        else if (this.speed < 0) this.speed = Math.min(this.speed + this.friction)
    }
}