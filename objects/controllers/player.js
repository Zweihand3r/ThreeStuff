class Player extends THREE.Object3D {
    
    pivot_LL = new THREE.Object3D()
    pivot_RL = new THREE.Object3D()

    pivot_LA = new THREE.Object3D()
    pivot_RA = new THREE.Object3D()

    constructor() {
        super()

        /* ------------- Geometry ------------ */

        const mat = new THREE.MeshPhongMaterial({ color: 0x3298ae })

        const legGeo = new THREE.BoxBufferGeometry(.25, .5, .2)
        const armGeo = new THREE.BoxBufferGeometry(.16, .6, .16)

        /* Left Leg */
        this.pivot_LL.position.set(.135, .5, 0)
        this.add(this.pivot_LL)
        
        const leftLeg = new THREE.Mesh(legGeo, mat)
        leftLeg.receiveShadow = true
        leftLeg.castShadow = true
        leftLeg.position.y = -.25
        this.pivot_LL.add(leftLeg)

        /* Right Leg */
        this.pivot_RL.position.set(-.135, .5, 0)
        this.add(this.pivot_RL)

        const rightLeg = new THREE.Mesh(legGeo, mat)
        rightLeg.receiveShadow = true
        rightLeg.castShadow = true
        rightLeg.position.y = -.25
        this.pivot_RL.add(rightLeg)

        /* Body */
        const bodyGeo = new THREE.BoxBufferGeometry(.52, .5, .25)
        const body = new THREE.Mesh(bodyGeo, mat)
        body.receiveShadow = true
        body.castShadow = true
        body.position.y = .75
        this.add(body)

        /* Head */
        const headGeo = new THREE.BoxBufferGeometry(.49, .49, .4)
        const head = new THREE.Mesh(headGeo, mat)
        head.castShadow = true
        head.position.y = 1.249
        this.add(head)

        /* Left Arm */
        this.pivot_LA.position.set(.35, 1, 0)
        this.add(this.pivot_LA)

        const leftArm = new THREE.Mesh(armGeo, mat)
        leftArm.receiveShadow = true
        leftArm.castShadow = true
        leftArm.position.y = -.3
        this.pivot_LA.add(leftArm)

        /* Right Arm */
        this.pivot_RA.position.set(-.35, 1, 0)
        this.add(this.pivot_RA)

        const rightArm = new THREE.Mesh(armGeo, mat)
        rightArm.receiveShadow = true
        rightArm.castShadow = true
        rightArm.position.y = -.3
        this.pivot_RA.add(rightArm)


        /* -------------- Camera -------------- */

        this.cam_rear = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.add(this.cam_rear)
        this.cam_rear.rotation.set(.3, Math.PI, 0)
        this.cam_rear.position.set(0, 5, -10)


        /* ------------- Controls ------------- */

        this.speed = 0
        this.turn = 0

        this.speed_ACTUAL = 0
        this.speed_MAX = 10

        this.rotationIndex = 0
    }

    enableControls() { this.controlsEnabled = true }
    disableControls() { this.controlsEnabled = false }

    update(time) {
        let moveZ = 0
        let moveX = 0

        if (this.controlsEnabled) {
            if (key_up && this.speed < this.speed_MAX) {
                this.speed += 1
            }

            if (key_down && this.speed > -this.speed_MAX) {
                this.speed -= 1
            }

            if (!key_up && !key_down) {
                this._neutraliseSpeed()
            }

            if (key_left) this.turn = 1
            else if (key_right) this.turn = -1
            else this.turn = 0
        } else {
            this._neutraliseSpeed()
        }

        this.speed_ACTUAL = this.speed / this.speed_MAX

        if (this.turn != 0) {
            this.rotation.y += this.turn * 0.025
        }

        if (this.speed != 0) {
            const angle = this.rotation.y

            moveZ = Math.cos(angle) * this.speed_ACTUAL
            moveX = Math.sin(angle) * this.speed_ACTUAL
        }

        this.position.z += moveZ * 0.05
        this.position.x += moveX * 0.05

        /* Arms / Legs */

        this.rotationIndex += 10

        this._moveArms()
        this._moveLegs()
    }

    _moveArms() {
        const speed = this.speed_ACTUAL / 1.5
        this.pivot_LA.rotation.x = Math.sin(THREE.Math.degToRad(this.rotationIndex)) * -speed
        this.pivot_RA.rotation.x = Math.sin(THREE.Math.degToRad(this.rotationIndex)) * speed
    }

    _moveLegs() {
        const speed = this.speed_ACTUAL / 1.5
        this.pivot_LL.rotation.x = Math.sin(THREE.Math.degToRad(this.rotationIndex)) * speed
        this.pivot_RL.rotation.x = Math.sin(THREE.Math.degToRad(this.rotationIndex)) * -speed
    }

    _neutraliseSpeed() {
        if (this.speed > 0) this.speed -= 1
        else if (this.speed < 0) this.speed += 1
        else this.speed = 0
    }
}