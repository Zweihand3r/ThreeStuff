class Driver extends THREE.Object3D {

    pivots_FWs = []

    lights_head = []
    lights_front = []
    lightsMat_front = []

    lights_rear = []
    lightsMat_rear = []

    cam_rear_OFFSET = new THREE.Vector3(0, 5, -10)

    constructor(gui) {
        super()
        
        this._createGeometry()
        this._createCameras()


        /* ------------- Controls ------------- */

        this.engineOn = true
        this.lightsOn = false

        this.speed = 0
        this.turn = 0

        this.speed_MAX = 5
        this.speedRev_MAX = 2

        this.turn_MAX = .01
        this.turn_ACTUAL = 0

        this.accel = .025
        this.decel = .065
        this.friction = 0.005
        
        this.turnStep = .0001
        this.turnReset = .00025

        this.braking = false

        this.lightsIntensity = 0
        this.lightsIntensityStep = 1
        this.lightsIntensity_MAX = 10

        this.bobModifier = 0

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

        /* Adjusting turn to accomodate high speeds */
        const turn_OFFSET = THREE.Math.lerp(1, .4, THREE.Math.smoothstep(this.speed, 2, 5))
        this.turn_ACTUAL = this.turn * turn_OFFSET

        if (this.turn != 0) {
            this.rotation.y += this.turn_ACTUAL * this.speed
        }

        if (this.speed != 0) {
            const angle = this.rotation.y

            moveZ = Math.cos(angle) * this.speed
            moveX = Math.sin(angle) * this.speed
        }
        
        this.position.z += moveZ * 0.05
        this.position.x += moveX * 0.05

        this.rotationIndex += 10

        this._rotateWheels()
        this._turnWheels()

        this._updateCameras()

        this._updateLights()
        this._brakeLights()

        this._carBobbing(time)
    }

    _rotateWheels() {
        this.wheels.forEach((mesh) => {
            mesh.rotation.x += this.speed * .095
        })
    }

    _turnWheels() {
        this.pivots_FWs.forEach((pivot) => {
            pivot.rotation.y = this.turn_ACTUAL * 44
        })
    }

    _neutraliseSpeed() {
        if (this.speed > 0) this.speed = Math.max(this.speed - this.friction, 0)
        else if (this.speed < 0) this.speed = Math.min(this.speed + this.friction)
    }

    _updateCameras() {
        {
            /* Follow */
            const updatedPos = new THREE.Vector3().setFromMatrixPosition(this.cam_follow_PIVOT.matrixWorld)
            this.cam_follow.position.lerp(updatedPos, .1)
            this.cam_follow.lookAt(this.position.x, 2.5, this.position.z)
        }

        {
            /* Chase */
            const updatedPos = new THREE.Vector3().copy(this.position).add(this.cam_rear_OFFSET)
            this.cam_chase.position.lerp(updatedPos, .2)
            this.cam_chase.lookAt(this.position)
        }
    }

    _updateLights() {
        const current = this.lights_head[0].intensity

        if (this.lightsOn) {
            this.lightsIntensity = Math.min(this.lightsIntensity + this.lightsIntensityStep, this.lightsIntensity_MAX)
        } else {
            this.lightsIntensity = Math.max(this.lightsIntensity - this.lightsIntensityStep, 0)
        }

        if (current != this.lightsIntensity) {
            this.lights_head.forEach((light) => {
                light.intensity = this.lightsIntensity
            })

            const normalised = this.lightsIntensity / 10

            this.lights_front.forEach((light) => {
                light.intensity = normalised
            })

            this.lightsMat_front.forEach((mat) => {
                mat.emissive = new THREE.Color(normalised, normalised, normalised)
            })
        }
    }

    _brakeLights() {
        const current = this.lights_rear[0].intensity
        const intensity = this.braking || (!this.engineOn && key_down) ? 1 : 0

        if (current != intensity) {
            this.lights_rear.forEach((light) => {
                light.intensity = intensity
            })

            this.lightsMat_rear.forEach((mat) => {
                mat.emissive = new THREE.Color(intensity, 0, 0)
            })
        }
    }

    _carBobbing(time) {
        if (this.engineOn && this.bobModifier < 1) {
            this.bobModifier = Math.min(this.bobModifier + .05, 1)
        }

        if (!this.engineOn && this.bobModifier > 0) {
            this.bobModifier = Math.max(this.bobModifier - .025, 0)
        }

        if (this.speed >= 0) this.bobModifier *= (1 - THREE.Math.smoothstep(this.speed, 0, 3.5))
        else this.bobModifier *= THREE.Math.smoothstep(this.speed, -1.5, 0)

        this.body.position.y = Math.sin(time / 25) * .005 * this.bobModifier
    }

    _createGeometry() {
        const mat = new THREE.MeshPhongMaterial({ color: 0xcdcdcd })
        mat.shininess = 90

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
            wheel.castShadow = true

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
            this.body.add(mesh)

            if (index < 2) {
                {
                    const light = new THREE.SpotLight(0xffffff, this.lightsIntensity_MAX)
                    light.angle = THREE.Math.degToRad(45)
                    light.distance = 100
                    light.decay = 0
                    light.penumbra = .25
                    light.position.set(position[0], position[1], 1.55)
                    light.target.position.set(position[0], position[1], 10)
                    this.body.add(light)
                    this.body.add(light.target)

                    this.lights_head.push(light)
                    this.lightsMat_front.push(mat)
                }

                {
                    const light = new THREE.PointLight(0xffffff)
                    light.castShadow = true
                    light.distance = 1
                    light.decay = .5
                    light.position.set(position[0], position[1], 2.2)
                    this.body.add(light)

                    this.lights_front.push(light)
                }
            
            } else {
                mat.color = new THREE.Color(0xff0000)

                const light = new THREE.PointLight(0xff0000, 0)
                light.castShadow = true
                light.distance = 1
                light.decay = .5
                light.position.set(position[0], position[1], -2.2)
                this.add(light)

                this.lights_rear.push(light)
                this.lightsMat_rear.push(mat)
            }
        })
    }

    _createCameras() {
        const params = [45, window.innerWidth / window.innerHeight, .1, 1000]

        this.cam_follow_PIVOT = new THREE.Object3D()
        this.cam_follow_PIVOT.position.add(this.cam_rear_OFFSET)
        this.add(this.cam_follow_PIVOT)

        this.cam_follow = new THREE.PerspectiveCamera(...params)

        this.cam_chase = new THREE.PerspectiveCamera(...params)
        this.cam_chase.rotation.set(.3, Math.PI, 0)
        this.cam_chase.position.add(this.cam_rear_OFFSET)

        this.cam_hood = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 1000)
        this.cam_hood.rotation.set(0, Math.PI, 0)
        this.cam_hood.position.set(0, 1.4, .5)
        this.add(this.cam_hood)

        this.cam_rear = new THREE.PerspectiveCamera(...params)
        this.cam_rear.rotation.set(.3, Math.PI, 0)
        this.cam_rear.position.add(this.cam_rear_OFFSET)
        this.add(this.cam_rear)

        this.cam_left = new THREE.PerspectiveCamera(...params)
        this.cam_left.rotation.set(-Math.PI / 2, Math.PI / 2, Math.PI / 2)
        this.cam_left.position.set(10, 2.5, 0)
        this.add(this.cam_left)

        this.cam_top = new THREE.PerspectiveCamera(...params)
        this.cam_top.rotation.set(-Math.PI / 2, 0, Math.PI)
        this.cam_top.position.set(0, 10, 0)
        this.add(this.cam_top)

        this.cam_front = new THREE.PerspectiveCamera(...params)
        this.cam_front.rotation.set(-.3, 0, 0)
        this.cam_front.position.set(0, 5, 10)
        this.add(this.cam_front)
    }
}