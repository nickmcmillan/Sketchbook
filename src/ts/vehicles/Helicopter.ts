import * as CANNON from 'cannon';
import * as Utils from '../core/Utilities';

import { Vehicle } from './Vehicle';
import { KeyBinding } from '../core/KeyBinding';
import THREE = require('three');

export class Helicopter extends Vehicle 
{
    public rotors: THREE.Object3D[] = [];
    private enginePower: number = 0;

    constructor(gltf: any)
    {
        super(gltf);

        this.readHelicopterData(gltf);

        // this.collision.preStep = () => { 
        //   this.physicsPreStep();
        //  };

         const preStep = () => {
           this.physicsPreStep();
           requestAnimationFrame(preStep)
         }
         requestAnimationFrame(preStep)

        this.actions = {
            'ascend': new KeyBinding('KeyW'),
            'descend': new KeyBinding('KeyS'),
            'pitchUp': new KeyBinding('ArrowDown'),
            'pitchDown': new KeyBinding('ArrowUp'),
            'yawLeft': new KeyBinding('KeyA'),
            'yawRight': new KeyBinding('KeyD'),
            'rollLeft': new KeyBinding('ArrowLeft'),
            'rollRight': new KeyBinding('ArrowRight'),
            'exitVehicle': new KeyBinding('KeyF'),
        };
    }

    public takeControl(): void
    {
      this.world.inputManager.setInputReceiver(this);
    }

    public update(timeStep: number): void
    {
        super.update(timeStep);
        
        // Rotors visuals
        const running = true
        if (running)
        {
            if (this.enginePower < 1) this.enginePower += timeStep * 0.2;
            if (this.enginePower > 1) this.enginePower = 1;
        }
        else
        {
            if (this.enginePower > 0) this.enginePower -= timeStep * 0.06;
            if (this.enginePower < 0) this.enginePower = 0;
        }

        this.rotors.forEach((rotor) =>
        {
            rotor.rotateX(this.enginePower * timeStep * 30);
        });
    }

    public physicsPreStep(): void
    {
      const body = this.collision

        let quat = new THREE.Quaternion(
            body.quaternion.x,
            body.quaternion.y,
            body.quaternion.z,
            body.quaternion.w
        );

        let right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
        let globalUp = new THREE.Vector3(0, 1, 0);
        let up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
        let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
        
        // Throttle
        if (this.actions.ascend.isPressed)
        {
            body.velocity.x += up.x * 0.1 * this.enginePower;
            body.velocity.y += up.y * 0.1 * this.enginePower;
            body.velocity.z += up.z * 0.1 * this.enginePower;
        }
        if (this.actions.descend.isPressed)
        {
            body.velocity.x -= up.x * 0.1 * this.enginePower;
            body.velocity.y -= up.y * 0.1 * this.enginePower;
            body.velocity.z -= up.z * 0.1 * this.enginePower;
        }

        // Vertical stabilization
        let gravity = this.world.physicsWorld.gravity;
        let gravityCompensation = new CANNON.Vec3(-gravity.x, -gravity.y, -gravity.z).length();
        gravityCompensation *= this.world.physicsFrameTime;
        gravityCompensation *= 0.98;
        let dot = globalUp.dot(up);
        gravityCompensation *= Math.sqrt(THREE.MathUtils.clamp(dot, 0, 1));

        let vertDamping = Utils.threeVector(body.velocity);
        vertDamping.x *= up.x;
        vertDamping.y *= up.y;
        vertDamping.z *= up.z;
        vertDamping.multiplyScalar(-0.01);

        let vertStab = up.clone();
        vertStab.multiplyScalar((gravityCompensation));
        vertStab.multiplyScalar(Math.pow(this.enginePower, 3));
        vertStab.add(vertDamping);

        body.velocity.x += vertStab.x;
        body.velocity.y += vertStab.y;
        body.velocity.z += vertStab.z;

        // Positional damping
        body.velocity.x *= 0.99;
        body.velocity.z *= 0.99;

        // Rotation stabilization
        if (1)
        {
            let rotStabVelocity = new THREE.Quaternion().setFromUnitVectors(up, globalUp);
            rotStabVelocity.x *= 0.3;
            rotStabVelocity.y *= 0.3;
            rotStabVelocity.z *= 0.3;
            rotStabVelocity.w *= 0.3;
            const rotStabEuler = new THREE.Euler().setFromQuaternion(rotStabVelocity);
            
            body.angularVelocity.x += rotStabEuler.x;
            body.angularVelocity.y += rotStabEuler.y;
            body.angularVelocity.z += rotStabEuler.z;
        }

        // Pitch
        if (this.actions.pitchUp.isPressed)
        {
            body.angularVelocity.x -= right.x * 0.04 * this.enginePower;
            body.angularVelocity.y -= right.y * 0.04 * this.enginePower;
            body.angularVelocity.z -= right.z * 0.04 * this.enginePower;
        }
        if (this.actions.pitchDown.isPressed)
        {
            body.angularVelocity.x += right.x * 0.04 * this.enginePower;
            body.angularVelocity.y += right.y * 0.04 * this.enginePower;
            body.angularVelocity.z += right.z * 0.04 * this.enginePower;
        }

        // Yaw
        if (this.actions.yawLeft.isPressed)
        {
            body.angularVelocity.x += up.x * 0.04 * this.enginePower;
            body.angularVelocity.y += up.y * 0.04 * this.enginePower;
            body.angularVelocity.z += up.z * 0.04 * this.enginePower;
        }
        if (this.actions.yawRight.isPressed)
        {
            body.angularVelocity.x -= up.x * 0.04 * this.enginePower;
            body.angularVelocity.y -= up.y * 0.04 * this.enginePower;
            body.angularVelocity.z -= up.z * 0.04 * this.enginePower;
        }

        // Roll
        if (this.actions.rollLeft.isPressed)
        {
            body.angularVelocity.x -= forward.x * 0.06 * this.enginePower;
            body.angularVelocity.y -= forward.y * 0.06 * this.enginePower;
            body.angularVelocity.z -= forward.z * 0.06 * this.enginePower;
        }
        if (this.actions.rollRight.isPressed)
        {
            body.angularVelocity.x += forward.x * 0.06 * this.enginePower;
            body.angularVelocity.y += forward.y * 0.06 * this.enginePower;
            body.angularVelocity.z += forward.z * 0.06 * this.enginePower;
        }

        // Angular damping
        body.angularVelocity.x *= 0.97;
        body.angularVelocity.y *= 0.97;
        body.angularVelocity.z *= 0.97;
    }

    public readHelicopterData(gltf: any): void
    {
        gltf.scene.traverse((child) => {
            if (child.hasOwnProperty('userData'))
            {
                if (child.userData.hasOwnProperty('data'))
                {
                    if (child.userData.data === 'rotor')
                    {
                        this.rotors.push(child);
                    }
                }
            }
        });
    }

}
