class Spidey extends THREE.Object3D {

    pivot_Legs = []

    cam_rear_OFFSET = new THREE.Vector3(0, 3, -6)

    constructor(gui) {
        super()

        this._createGeometry()
        this._createCameras()

        this.engineOn = false
        this.engineTransition = 0

        this.speedZ = 0
        this.speedX = 0

        this.speed_ACTUAL = 0
        this.speed_MAX = 10

        this.rotationIndices = [0, 45, 90, 135]
        this.rotation_STEPSIZE = 15
    }

    enableControls() { this.controlsEnabled = true }
    disableControls() { this.controlsEnabled = false }

    update(time) {
        if (this.controlsEnabled) {

            if (key_up || key_right || key_down || key_left) {
                if (this.engineTransition < 1) {
                    this.engineTransition = Math.min(this.engineTransition + .05, 1)
                } else {
                    this.engineOn = true
                }
            
            } else {
                if (this.engineTransition > 0) {
                    this.engineTransition = Math.max(this.engineTransition - .05, 0)
                } else {
                    this.engineOn = false
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
            this._neutraliseSpeed()
        }

        this.speed_ACTUAL = Math.max(Math.abs(this.speedZ), Math.abs(this.speedX)) / this.speed_MAX

        this.position.z += this.speedZ * .005
        this.position.x += this.speedX * .005

        this._moveLegs()

        this._updateFollowCamera()

        this._updateEngineLights()
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

    _moveLegs() {
        /* 
         * rotationIndices changes speed for each leg
         * angleOffset changes angle
         * minus before angleOffset is to restrict upward motion
         */

        const angleOffset = .4

        this.pivot_Legs.forEach((pivot, index) => {
            this.rotationIndices[index] += this.rotation_STEPSIZE
            pivot.rotation.x = Math.abs(Math.sin(THREE.Math.degToRad(this.rotationIndices[index]))) * this.speed_ACTUAL * -angleOffset
        })
    }

    _updateEngineLights() {
        this.engineLightsMat.opacity = this.engineTransition
        this.engineLight.intensity = THREE.Math.lerp(0, .25, this.engineTransition)
    }

    _createGeometry() {
        const mat = new THREE.MeshPhongMaterial({ color: 0xdedfdf })
        const mat_engine = new THREE.MeshPhongMaterial({ color: 0x919191 })
        const testMat = new THREE.MeshPhongMaterial({ color: 0xff0000 })

        this.body = new THREE.Object3D()
        this.add(this.body)

        /*const humanRefGeo = new THREE.BoxBufferGeometry(.82, 1.5, .4)
        const humanRef = new THREE.Mesh(humanRefGeo, mat)
        humanRef.position.set(2, .75, 0)
        this.add(humanRef)*/

        this.upperBody = new THREE.Object3D()
        this.upperBody.position.set(0, .29, 0)
        this.body.add(this.upperBody)

        /*const midSectionGeo = new THREE.CylinderBufferGeometry(.2, .2, .25, 16)
        const midSection = new THREE.Mesh(midSectionGeo, mat)
        midSection.position.set(0, .125, 0)
        midSection.castShadow = true
        this.upperBody.add(midSection)*/

        const midSection_adv = new THREE.Object3D()
        midSection_adv.position.set(0, .125, 0)
        this.upperBody.add(midSection_adv)

        const mid_advGeo = new THREE.CylinderBufferGeometry(.2, .2, .1, 16)
        const mid_advPositions = [ [0, .075, 0], [0, -.075, 0] ]
        mid_advPositions.forEach((position) => {
            const mid_adv = new THREE.Mesh(mid_advGeo, mat)
            mid_adv.castShadow = true
            mid_adv.position.set(...position)
            midSection_adv.add(mid_adv)
        })

        {
            /* Engine Lights */
            this.engineLightsMat = new THREE.MeshPhongMaterial({ color: 0xff0000 })
            this.engineLightsMat.emissive = new THREE.Color(1, 0, 0)
            this.engineLightsMat.transparent = true
            this.engineLightsMat.opacity = 0

            const engineLightsObjBgGeo = new THREE.CylinderBufferGeometry(.179, .179, .05, 16)
            const engineLightsObjBg = new THREE.Mesh(engineLightsObjBgGeo, mat_engine)
            midSection_adv.add(engineLightsObjBg)

            const engineLightsObjGeo = new THREE.CylinderBufferGeometry(.18, .18, .05, 16)
            const engineLightsObj = new THREE.Mesh(engineLightsObjGeo, this.engineLightsMat)
            midSection_adv.add(engineLightsObj)

            this.engineLight = new THREE.PointLight(0xff0000, 0)
            midSection_adv.add(this.engineLight)
        }

        const topSectionGeo = new THREE.SphereBufferGeometry(.2, 16, 16)
        const topSection = new THREE.Mesh(topSectionGeo, mat)
        topSection.position.set(0, .25, 0)
        topSection.castShadow = true
        this.upperBody.add(topSection)

        this.lowerBody = new THREE.Object3D()
        this.lowerBody.position.set(0, .166, 0)
        this.lowerBody.rotation.set(0, THREE.Math.degToRad(45), 0)
        this.body.add(this.lowerBody)

        const baseSectionGeo = new THREE.CylinderBufferGeometry(.16, .16, .125, 16)
        const baseSection = new THREE.Mesh(baseSectionGeo, mat)
        baseSection.position.set(0, .0625, 0)
        baseSection.receiveShadow = true
        this.lowerBody.add(baseSection)

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


        /* ----------------- LEGS ----------------- */

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

            const legJoint_2 = new THREE.Mesh(legJointGeo, mat)
            legJoint_2.position.set(0, .1, 0)
            legJoint_2.rotation.set(THREE.Math.degToRad(22.5), 0, 0)
            legSection_1.add(legJoint_2)

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