class Spidey extends THREE.Object3D {

    eyes = []

    pivot_Legs = []
    pivot_Legs_2 = []

    cam_rear_OFFSET = new THREE.Vector3(0, 3, -6)

    bodyPositionY_IDLE = -.161
    pivotLegEulerX_IDLE = THREE.Math.degToRad(-48.8)
    pivotLeg2EulerX_IDLE = THREE.Math.degToRad(-18.6)

    eyesPositionZ_IDLE_LIST = [.095, .11, .125]

    updateHook = function() {}

    constructor(gui) {
        super()

        const spidey_gui = gui.addFolder("SPIDER BOT CONTROLS")
        spidey_gui.open()

        this._createGeometry(true, spidey_gui)
        this._createCameras()

        this.controlsEngaged = false

        this.isIdle = true
        this.idleTransitionStartTriggered = false
        this.idleTransition = 1

        this.idleTimeout_START = 100
        this.idleTimeout = this.idleTimeout_START

        this.engineOn = false
        this.engineTransition = 0

        this.speedZ = 0
        this.speedX = 0

        this.speed_ACTUAL = 0
        this.speed_MAX = 10

        this.lookZ = 1
        this.lookX = 0

        this.rotationIndices = [0, 45, 90, 135]
        this.rotation_STEPSIZE = 15
    }

    enableControls() { this.controlsEnabled = true }
    disableControls() { this.controlsEnabled = false }

    update(time) {
        if (this.controlsEnabled) {

            this.controlsEngaged = key_up || key_right || key_down || key_left

            if (this.controlsEngaged) {
                if (!this.idleTransitionStartTriggered) {
                    this.idleTransitionStartTriggered = true
                }

                if (this.idleTimeout < this.idleTimeout_START) {
                    this.idleTimeout = this.idleTimeout_START
                }
            } 

            if (this.idleTransitionStartTriggered) {
                if (this.idleTransition > 0) {
                    this.idleTransition = Math.max(this.idleTransition - .05, 0)
                } else {
                    this.isIdle = false

                    if (this.engineTransition < 1) {
                        this.engineTransition = Math.min(this.engineTransition + .05, 1)
                    } else {
                        this.engineOn = true

                        this.idleTransitionStartTriggered = false
                    }
                }
            }

            if (!this.controlsEngaged) {
                if (this.idleTimeout > 0) {
                    this.idleTimeout -= 1
                } else {
                    if (this.engineTransition > 0) {
                        this.engineTransition = Math.max(this.engineTransition - .05, 0)
                    } else {
                        this.engineOn = false

                        if (this.idleTransition < 1) {
                            this.idleTransition = Math.min(this.idleTransition + .05, 1)
                        } else {
                            this.isIdle = true
                        }
                    }
                }
            }

            if (this.engineOn) {
                /* speedZ */
                if (key_up && this.speedZ < this.speed_MAX) {
                    this.speedZ += 1
                }

                if (key_down && this.speedZ > -this.speed_MAX) {
                    this.speedZ -= 1
                }

                if (!key_up && !key_down) {
                    this._neutraliseSpeedZ()
                }

                /* speedX */
                if (key_left && this.speedX < this.speed_MAX) {
                    this.speedX += 1
                }

                if (key_right && this.speedX > -this.speed_MAX) {
                    this.speedX -= 1
                }

                if (!key_right && !key_left) {
                    this._neutraliseSpeedX()
                }
            
            } else {
                this._neutraliseSpeed()
            }
        
        } else {
            this.controlsEngaged = false
            this._neutraliseSpeed()
        }

        this.speed_ACTUAL = Math.max(Math.abs(this.speedZ), Math.abs(this.speedX)) / this.speed_MAX

        this.position.z += this.speedZ * .005
        this.position.x += this.speedX * .005

        this._rotateHead()
        this._moveLegs()

        this._updateFollowCamera()

        this._updateIdle()
        this._updateEngine()

        this.updateHook(time)
    }

    _neutraliseSpeed() {
        this._neutraliseSpeedZ()
        this._neutraliseSpeedX()
    }

    _neutraliseSpeedZ() {
        if (this.speedZ != 0) {
            if (this.speedZ > 0) this.speedZ -= 1
            else if (this.speedZ < 0) this.speedZ += 1
        }
    }

    _neutraliseSpeedX() {
        if (this.speedX != 0) {
            if (this.speedX > 0) this.speedX -= 1
            else if (this.speedX < 0) this.speedX += 1
        }
    }

    _updateFollowCamera() {
        const updatedPos = new THREE.Vector3().setFromMatrixPosition(this.cam_follow_PIVOT.matrixWorld)
        this.cam_follow.position.lerp(updatedPos, .02)
        this.cam_follow.lookAt(this.position.x, 1.125, this.position.z)
    }

    _rotateHead() {
        /*if (this.controlsEngaged && this.engineOn) {
            this.updateMatrixWorld()
            const topSectionY = new THREE.Vector3().setFromMatrixPosition(this.topSection.matrixWorld).y

            this.topSection.lookAt(new THREE.Vector3(
                this.position.x + this.speedX / 10,
                topSectionY,
                this.position.z + this.speedZ / 10
            ))
        }*/

        if (this.controlsEngaged && this.engineOn) {
            if (key_up && this.lookZ < 1) {
                this.lookZ = Math.min(this.lookZ + .1, 1)
            }

            if (key_down && this.lookZ > -1) {
                this.lookZ = Math.max(this.lookZ - .1, -1)
            }

            if (!key_up && !key_down) {
                if (this.lookZ > 0) this.lookZ = Math.max(this.lookZ - .1, 0)
                else if (this.lookZ < 0) this.lookZ = Math.min(this.lookZ + .1, 0)
            }

            if (key_left && this.lookX < 1) {
                this.lookX = Math.min(this.lookX + .1, 1)
            }

            if (key_right && this.lookX > -1) {
                this.lookX = Math.max(this.lookX - .1, -1)
            }

            if (!key_left && !key_right) {
                if (this.lookX > 0) this.lookX = Math.max(this.lookX - .1, 0)
                else if (this.lookX < 0) this.lookX = Math.min(this.lookX + .1, 0)
            }

            this.updateMatrixWorld()
            this.topSection.lookAt(new THREE.Vector3(
                this.position.x + this.lookX,
                new THREE.Vector3().setFromMatrixPosition(this.topSection.matrixWorld).y,
                this.position.z + this.lookZ
            ))
        }
    }

    _moveLegs() {
        /* 
         * rotationIndices changes speed for each leg
         * angleOffset changes angle
         * minus before angleOffset is to restrict to upward motion
         */

        const angleOffset = .4

        this.pivot_Legs.forEach((pivot, index) => {
            this.rotationIndices[index] += this.rotation_STEPSIZE
            pivot.rotation.x = Math.abs(Math.sin(THREE.Math.degToRad(this.rotationIndices[index]))) * this.speed_ACTUAL * -angleOffset
        })

        /*const angleOffset = .4
        const angleOffset_2 = angleOffset / 2
        for (let index = 0; index < 4; index++) {
            this.rotationIndices[index] += this.rotation_STEPSIZE

            this.pivot_Legs[index].rotation.x = Math.abs(Math.sin(THREE.Math.degToRad(this.rotationIndices[index]))) * this.speed_ACTUAL * -angleOffset
            this.pivot_Legs_2[index].rotation.x = Math.abs(Math.sin(THREE.Math.degToRad(this.rotationIndices[index]))) * this.speed_ACTUAL * -angleOffset_2
        }*/
    }

    _updateIdle() {
        /* Same like driver speedometer */

        if (this.speed_ACTUAL == 0) {
            this.body.position.y = THREE.Math.lerp(0, this.bodyPositionY_IDLE, this.idleTransition)

            for (let index = 0; index < 4; index++) {
                this.pivot_Legs[index].rotation.x = THREE.Math.lerp(0, this.pivotLegEulerX_IDLE, this.idleTransition)
                this.pivot_Legs_2[index].rotation.x = THREE.Math.lerp(0, this.pivotLeg2EulerX_IDLE, this.idleTransition)
            }
        }
    }

    _updateEngine() {
        this.topSection.position.y = THREE.Math.lerp(.2, .25, this.engineTransition)

        this.eyeLight.intensity = THREE.Math.lerp(0, 2, this.engineTransition)
        this.eyes.forEach((eye, index) => {
            eye.position.z = THREE.Math.lerp(this.eyesPositionZ_IDLE_LIST[index], .15, this.engineTransition)
        })
        
        this.engineLightsMat.opacity = this.engineTransition
        this.engineLight.intensity = THREE.Math.lerp(0, .5, this.engineTransition)
    }

    _createGeometry(legs_ALT = true, folder) {
        const controls = {
            matFinish: false,
            engineLights: 0xff0000,

            pulse: {
                enabled: false,
                speed: 5,
                color: 0x0000ff,
                info: function() {}
            }
        }

        const mat = new THREE.MeshStandardMaterial({ color: 0xdedfdf })
        mat.metalness = .6
        mat.roughness = .15

        folder.add(controls, 'matFinish').name("Matte Finish").onChange(updateMatFinish)

        function updateMatFinish() {
            if (controls.matFinish) {
                mat.metalness = .8
                mat.roughness = .8 
            } else {
                mat.metalness = .6
                mat.roughness = .15
            }
        }


        const mat_engine = new THREE.MeshPhongMaterial({ color: 0x919191 })
        const testMat = new THREE.MeshPhongMaterial({ color: 0xff0000 })

        this.body = new THREE.Object3D()
        this.add(this.body)

        /*const humanRefGeo = new THREE.BoxBufferGeometry(.82, 1.5, .4)
        const humanRef = new THREE.Mesh(humanRefGeo, mat)
        humanRef.position.set(2, .75, 0)
        this.add(humanRef)*/


        /* ------------- UPPER SECTION ------------ */

        this.upperBody = new THREE.Object3D()
        this.upperBody.position.set(0, .29, 0)
        this.body.add(this.upperBody)

        const topSectionGeo = new THREE.SphereBufferGeometry(.2, 16, 16)
        this.topSection = new THREE.Mesh(topSectionGeo, mat)
        this.topSection.position.set(0, .25, 0)
        this.topSection.castShadow = true
        this.upperBody.add(this.topSection)


        const midSectionGeo = new THREE.CylinderBufferGeometry(.2, .2, .1, 16)

        const midSection_upper = new THREE.Mesh(midSectionGeo, mat)
        midSection_upper.position.set(0, -.05, 0)
        midSection_upper.castShadow = true
        this.topSection.add(midSection_upper)

        const midSection_adv = new THREE.Object3D()
        midSection_adv.position.set(0, .125, 0)
        this.upperBody.add(midSection_adv)

        const midSection_lower = new THREE.Mesh(midSectionGeo, mat)
        midSection_lower.position.set(0, -.075, 0)
        midSection_lower.castShadow = true
        midSection_adv.add(midSection_lower)
        

        /* ---------------- ENGINE ---------------- */

        this.engineLightsMat = new THREE.MeshPhongMaterial({ color: 0xff0000 })
        this.engineLightsMat.emissive = new THREE.Color(controls.engineLights)
        this.engineLightsMat.transparent = true
        this.engineLightsMat.opacity = 0

        const engineLightsObjBgGeo = new THREE.CylinderBufferGeometry(.179, .179, .05, 16)
        const engineLightsObjBg = new THREE.Mesh(engineLightsObjBgGeo, mat_engine)
        midSection_adv.add(engineLightsObjBg)

        const engineLightsObjGeo = new THREE.CylinderBufferGeometry(.18, .18, .05, 16)
        const engineLightsObj = new THREE.Mesh(engineLightsObjGeo, this.engineLightsMat)
        midSection_adv.add(engineLightsObj)

        this.engineLight = new THREE.PointLight(controls.engineLights, 0)
        this.engineLight.castShadow = true
        this.engineLight.shadow.camera.near = .1
        midSection_adv.add(this.engineLight)

        /* z: .15 */
        const eyePositions = [
            [0, .05, this.eyesPositionZ_IDLE_LIST[0]], 
            [.05, 0, this.eyesPositionZ_IDLE_LIST[1]], 
            [-.05, 0, this.eyesPositionZ_IDLE_LIST[2]]
        ]

        const eyeGeo = new THREE.CylinderBufferGeometry(.02, .02, .1, 16)
        const eyeMat = new THREE.MeshPhongMaterial({ color: 0xff0000 })
        eyeMat.emissive = new THREE.Color(controls.engineLights)

        eyePositions.forEach(position => {
            const eye = new THREE.Mesh(eyeGeo, eyeMat)
            eye.position.set(...position)
            eye.rotation.set(THREE.Math.degToRad(90), 0, 0)
            this.topSection.add(eye)
            this.eyes.push(eye)
        })

        this.eyeLight = new THREE.SpotLight(controls.engineLights, 0)
        this.eyeLight.castShadow = true
        this.eyeLight.shadow.camera.near = .01
        this.eyeLight.penumbra = .1
        this.eyeLight.angle = Math.PI / 3.5
        this.eyeLight.decay = .5
        this.eyeLight.position.set(0, .05, .2)
        this.eyeLight.target.position.set(0, 0, .3)
        this.topSection.add(this.eyeLight)
        this.topSection.add(this.eyeLight.target)


        folder.addColor(controls, 'engineLights').name("Engine Color").onChange(updateEngineLightsColor)

        /* Cant access class properties inside updateEngineLightsColor for some reason */
        const engineLightsMat = this.engineLightsMat
        const engineLight = this.engineLight

        const eyeLight = this.eyeLight

        function updateEngineLightsColor() {
            if (!controls.pulse.enabled) {
                setEngineLightsColor(new THREE.Color(controls.engineLights))
            }
        }

        function setEngineLightsColor(color) {
            engineLightsMat.color.set(controls.engineLights)
            engineLightsMat.emissive = color
            engineLight.color = color

            eyeMat.color.set(controls.engineLights)
            eyeMat.emissive = color
            eyeLight.color = color
        }


        const pulseFolder = folder.addFolder("Pulse Controls (EXPERIMENTAL) WARNING!!! FLASHING LIGHTS!")
        pulseFolder.add(controls.pulse, "info").name("")
        pulseFolder.add(controls.pulse, "enabled").name("Enabled").onChange(updateEngineLightsColor)
        pulseFolder.add(controls.pulse, "speed", 1, 10, 1).name("Speed")
        pulseFolder.addColor(controls.pulse, "color").name("Color")

        this.updateHook = function(time) {
            if (controls.pulse.enabled) {
                const pulseTransition = Math.abs(Math.sin(THREE.Math.degToRad(time * controls.pulse.speed * .1)))

                const targetColor = new THREE.Color(controls.pulse.color)
                setEngineLightsColor(new THREE.Color(controls.engineLights).lerp(targetColor, pulseTransition))
            }
        }

        /* ------------- LOWER SECTION ------------ */

        this.lowerBody = new THREE.Object3D()
        this.lowerBody.position.set(0, .166, 0)
        this.lowerBody.rotation.set(0, THREE.Math.degToRad(45), 0)
        this.body.add(this.lowerBody)

        const baseSectionGeo = new THREE.CylinderBufferGeometry(.16, .16, .125, 16)
        const baseSection = new THREE.Mesh(baseSectionGeo, mat)
        baseSection.position.set(0, .0625, 0)
        baseSection.receiveShadow = true
        this.lowerBody.add(baseSection)


        /* ----------------- LEGS ----------------- */

        if (!legs_ALT) {
            const crossSectionGeo = new THREE.CylinderBufferGeometry(.05, .05, .5, 16)
            const crossSectionRotations = [
                [THREE.Math.degToRad(90), 0, 0],
                [0, 0, THREE.Math.degToRad(90)]
            ]

            crossSectionRotations.forEach((rotation) => {
                const crossSection = new THREE.Mesh(crossSectionGeo, mat)
                crossSection.position.set(0, .06, 0)
                crossSection.rotation.set(...rotation)
                crossSection.castShadow = true
                this.lowerBody.add(crossSection)
            })

            const legJointGeo = new THREE.SphereBufferGeometry(.05, 16, 16)
            const legSectionGeo = new THREE.CylinderBufferGeometry(.05, .05, .2, 16)

            for (let index = 0; index < 4; index++) {
                const leg = new THREE.Object3D()
                leg.position.set(0, .06, 0)
                leg.rotation.set(0, THREE.Math.degToRad(90) * index, 0)
                this.lowerBody.add(leg)

                const legPivot = new THREE.Object3D()
                legPivot.position.set(0, 0, .25)
                leg.add(legPivot)

                /* Adding to pivot for leg movement */
                this.pivot_Legs.push(legPivot)

                const legJoint_1 = new THREE.Mesh(legJointGeo, mat)
                legJoint_1.rotation.set(THREE.Math.degToRad(-45), 0, 0)
                legPivot.add(legJoint_1)

                const legSection_1 = new THREE.Mesh(legSectionGeo, mat)
                legSection_1.position.set(0, 0, .1)
                legSection_1.rotation.set(THREE.Math.degToRad(90), 0, 0)
                legSection_1.castShadow = true
                legJoint_1.add(legSection_1)

                const legPivot_2 = new THREE.Object3D()
                legPivot_2.position.set(0, .1, 0)
                legSection_1.add(legPivot_2)

                /* Adding to the second pivot */
                this.pivot_Legs_2.push(legPivot_2)

                const legJoint_2 = new THREE.Mesh(legJointGeo, mat)
                legJoint_2.rotation.set(THREE.Math.degToRad(22.5), 0, 0)
                legPivot_2.add(legJoint_2)

                const legSection_2 = new THREE.Mesh(legSectionGeo, mat)
                legSection_2.position.set(0, 0, .1)
                legSection_2.rotation.set(THREE.Math.degToRad(90), 0, 0)
                legSection_2.castShadow = true
                legJoint_2.add(legSection_2)

                const sectionEndGeo = new THREE.CylinderBufferGeometry(.01, .05, .2, 16)
                const legSectionEnd = new THREE.Mesh(sectionEndGeo, mat)
                legSectionEnd.position.set(0, 0, .3)
                legSectionEnd.rotation.set(THREE.Math.degToRad(90), 0, 0)
                legSectionEnd.castShadow = true
                legJoint_2.add(legSectionEnd)
            }
        
        } else {
            const crossSectionSizes = [ [.11, .05, .5], [.5, .05, .11] ]
            crossSectionSizes.forEach(size => {
                const crossSectionGeo = new THREE.BoxBufferGeometry(...size)
                const crossSection = new THREE.Mesh(crossSectionGeo, mat)
                crossSection.position.set(0, .06, 0)
                crossSection.castShadow = true
                this.lowerBody.add(crossSection)
            })

            for (let index = 0; index < 4; index++) {
                const leg = new THREE.Object3D()
                leg.position.set(0, .06, 0)
                leg.rotation.set(0, THREE.Math.degToRad(90) * index, 0)
                this.lowerBody.add(leg)

                const legPivot = new THREE.Object3D()
                legPivot.position.set(0, 0, .25)
                leg.add(legPivot)

                this.pivot_Legs.push(legPivot)

                const legJoint_1 = new THREE.Object3D()
                legJoint_1.rotation.set(0, THREE.Math.degToRad(45), 0)
                legPivot.add(legJoint_1)

                const legJoint_1_ArtGeo = new THREE.CylinderBufferGeometry(.035, .035, .12, 16)
                const legJoint_1_Art = new THREE.Mesh(legJoint_1_ArtGeo, mat)
                legPivot.rotation.set(0, 0, THREE.Math.degToRad(90))
                legJoint_1_Art.castShadow = true
                legJoint_1.add(legJoint_1_Art)

                const legJoint_1_CapPositions = [ [0, .07, 0], [0, -.07, 0] ]
                const legJointCapGeo = new THREE.CylinderBufferGeometry(.045, .045, .02, 16)

                legJoint_1_CapPositions.forEach(position => {
                    const legJoint_1_Cap = new THREE.Mesh(legJointCapGeo, mat)
                    legJoint_1_Cap.position.set(...position)
                    legJoint_1_Art.add(legJoint_1_Cap)
                })


                const legSection_1Geo = new THREE.BoxBufferGeometry(.11, .05, .2)
                const legSection_1 = new THREE.Mesh(legSection_1Geo, mat)
                legSection_1.position.set(0, 0, .1)
                legSection_1.rotation.set(0, 0, THREE.Math.degToRad(90))
                legSection_1.castShadow = true
                legJoint_1.add(legSection_1)
                
                const legPivot_2 = new THREE.Object3D()
                legPivot_2.position.set(0, 0, .1)
                legSection_1.add(legPivot_2)

                this.pivot_Legs_2.push(legPivot_2)

                const legJoint_2Geo = new THREE.CylinderBufferGeometry(.035, .035, .16, 16)
                const legJoint_2 = new THREE.Mesh(legJoint_2Geo, mat)
                legJoint_2.rotation.set(THREE.Math.degToRad(-22.5), 0, THREE.Math.degToRad(-90))
                legJoint_2.castShadow = true
                legPivot_2.add(legJoint_2)

                const legSection_2_Geo = new THREE.BoxBufferGeometry(.38, .04, .05)

                const legSection_2_1 = new THREE.Mesh(legSection_2_Geo, mat)
                legSection_2_1.position.set(-.188, .032, 0)
                legSection_2_1.rotation.set(0, 0, THREE.Math.degToRad(8.5))
                legSection_2_1.castShadow = true
                legJoint_2.add(legSection_2_1)

                const legSection_2_2 = new THREE.Mesh(legSection_2_Geo, mat)
                legSection_2_2.position.set(-.188, -.032, 0)
                legSection_2_2.rotation.set(0, 0, THREE.Math.degToRad(-8.5))
                legSection_2_2.castShadow = true
                legJoint_2.add(legSection_2_2)

                const legEndGeo = new THREE.CylinderBufferGeometry(.024, .024, .05, 16)
                const legEnd = new THREE.Mesh(legEndGeo, mat)
                legEnd.position.set(-.376, 0, 0)
                legEnd.rotation.set(THREE.Math.degToRad(90), 0, 0)
                legJoint_2.add(legEnd)
            }
        }
    }

    _createCameras() {
        const params = [45, window.innerWidth / window.innerHeight, .1, 1000]

        this.cam_follow_PIVOT = new THREE.Object3D()
        this.cam_follow_PIVOT.position.add(this.cam_rear_OFFSET)
        this.add(this.cam_follow_PIVOT)

        this.cam_follow = new THREE.PerspectiveCamera(...params)

        this.cam_rear = new THREE.PerspectiveCamera(...params)
        this.cam_rear.rotation.set(.3, Math.PI, 0)
        this.cam_rear.position.add(this.cam_rear_OFFSET)
        this.add(this.cam_rear)
    }
}