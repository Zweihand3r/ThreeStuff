class Driver extends THREE.Object3D {
    constructor() {
        super()
        
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
                this.body.add(mesh)
            }
        }

        const wheelPositions = [
            [.845, .34, 1.23], // FL
            [-.845, .34, 1.23], // FR
            [.845, .34, -1.23], // RL
            [-.845, .34, -1.23] // RR
        ]

        const wheelGeo = new THREE.CylinderBufferGeometry(.34, .34, .3, 16)
        const wheelMat = new THREE.MeshPhongMaterial({ color: 0x343434 })

        this.wheels = []
        this.pivots_FWs = []

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
            [.72, .72, 1.965],
            [-.72, .72, 1.965],
            [.72, .72, -1.965],
            [-.72, .72, -1.965]
        ]

        const lightGeo = new THREE.BoxBufferGeometry(.4, .2, .1)
        const lightMat = new THREE.MeshPhongMaterial({ color: 0xffffff })

        lightPositions.forEach((position) => {
            const mesh = new THREE.Mesh(lightGeo, lightMat)
            mesh.position.set(...position)
            this.add(mesh)
        })
    }

    enableControls() { this.controlsEnabled = true }
    disableControls() { this.controlsEnabled = false }
}