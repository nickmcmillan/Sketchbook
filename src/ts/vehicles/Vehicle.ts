// import { Character } from '../characters/Character';
import * as THREE from 'three';
import * as CANNON from 'cannon';
import { World } from '../core/World';
import _ = require('lodash');
import { KeyBinding } from '../core/KeyBinding';
import * as Utils from '../core/Utilities';
import { CollisionGroups } from '../enums/CollisionGroups';

export abstract class Vehicle extends THREE.Object3D
{
    // public controllingCharacter: Character;
    public actions: { [action: string]: KeyBinding; } = {};
    public rayCastVehicle: CANNON.RaycastVehicle;
    public drive: string;

    public camera: any;

    public world: World;

    public help: THREE.AxesHelper;

    // TODO: remake to a Sketchbook Object
    public collision: CANNON.Body;

    // public model: any;
    public materials: THREE.Material[] = [];
    private modelContainer: THREE.Group;

    private firstPerson: boolean = false;

    constructor(gltf: any, handlingSetup?: any)
    {
        super();

        if (handlingSetup === undefined) handlingSetup = {};
        handlingSetup.chassisConnectionPointLocal = new CANNON.Vec3(),
        handlingSetup.axleLocal = new CANNON.Vec3(-1, 0, 0);
        handlingSetup.directionLocal = new CANNON.Vec3(0, -1, 0);

        // Physics mat
        let mat = new CANNON.Material('Mat');
        mat.friction = 0.01;

        // Collision body
        this.collision = new CANNON.Body({ mass: 50 });
        this.collision.material = mat;

        // Read GLTF
        this.readVehicleData(gltf);

        this.modelContainer = new THREE.Group();
        this.add(this.modelContainer);
        this.modelContainer.add(gltf.scene);
        // this.setModel(gltf.scene);

        // Raycast vehicle component
        this.rayCastVehicle = new CANNON.RaycastVehicle({
            chassisBody: this.collision,
            indexUpAxis: 1,
            indexRightAxis: 0,
            indexForwardAxis: 2
        });


        this.help = new THREE.AxesHelper(2);
    }

    // public setModel(model: any): void
    // {
    //     this.modelContainer.remove(this.model);
    //     this.model = model;
    //     this.modelContainer.add(this.model);
    // }

    public update(timeStep: number): void
    {
        this.help.position.copy(Utils.threeVector(this.collision.interpolatedPosition));
        this.help.quaternion.copy(Utils.threeQuat(this.collision.interpolatedQuaternion));

        this.position.set(
            this.collision.interpolatedPosition.x,
            this.collision.interpolatedPosition.y,
            this.collision.interpolatedPosition.z
        );

        this.quaternion.set(
            this.collision.interpolatedQuaternion.x,
            this.collision.interpolatedQuaternion.y,
            this.collision.interpolatedQuaternion.z,
            this.collision.interpolatedQuaternion.w
        );

    }

    public onInputChange(): void
    {
        // if (this.actions.exitVehicle.justPressed )
        // {
        //     // this.controllingCharacter.modelContainer.visible = true;
        //     // this.controllingCharacter.exitVehicle();
        // }

    }

    public resetControls(): void
    {
        for (const action in this.actions) {
            if (this.actions.hasOwnProperty(action)) {
                this.triggerAction(action, false);
            }
        }
    }

    public allowSleep(value: boolean): void
    {
        this.collision.allowSleep = value;

        if (value === false)
        {
            this.collision.wakeUp();
        }
    }

    public handleKeyboardEvent(event: KeyboardEvent, code: string, pressed: boolean): void
    {
        // Free camera
        if (code === 'KeyC' && pressed === true && event.shiftKey === true)
        {
            this.resetControls();
            // this.world.cameraOperator.characterCaller = this.controllingCharacter;
            this.world.inputManager.setInputReceiver(this.world.cameraOperator);
        }
        else if (code === 'KeyC')
        {
            this.firstPerson = true;
            this.world.cameraOperator.setRadius(0, true);
            // this.controllingCharacter.modelContainer.visible = false;
        }
        else
        {
            for (const action in this.actions) {
                if (this.actions.hasOwnProperty(action)) {
                    const binding = this.actions[action];

                    if (_.includes(binding.eventCodes, code))
                    {
                        this.triggerAction(action, pressed);
                    }
                }
            }
        }
    }
    
    public triggerAction(actionName: string, value: boolean): void
    {
        // Get action and set it's parameters
        let action = this.actions[actionName];

        if (action.isPressed !== value)
        {
            // Set value
            action.isPressed = value;

            // Reset the 'just' attributes
            action.justPressed = false;
            action.justReleased = false;

            // Set the 'just' attributes
            if (value) action.justPressed = true;
            else action.justReleased = true;

            this.onInputChange();

            // Reset the 'just' attributes
            action.justPressed = false;
            action.justReleased = false;
        }
    }

    public handleMouseButton(event: MouseEvent, code: string, pressed: boolean): void
    {
        return;
    }

    public handleMouseMove(event: MouseEvent, deltaX: number, deltaY: number): void
    {
        this.world.cameraOperator.move(deltaX, deltaY);
    }

    public inputReceiverInit(): void
    {
        this.collision.allowSleep = false;
        this.world.cameraOperator.setRadius(6);
    }

    public inputReceiverUpdate(timeStep: number): void
    {
    
        // Position camera
        this.world.cameraOperator.target.set(
            this.position.x,
            this.position.y,
            this.position.z,
        );

    }

    public setPosition(x: number, y: number, z: number): void
    {
        this.collision.position.x = x;
        this.collision.position.y = y;
        this.collision.position.z = z;
    }

    public addToWorld(world: World): void
    {
        if (_.includes(world.vehicles, this))
        {
            console.warn('Adding character to a world in which it already exists.');
        }
        else if (this.rayCastVehicle === undefined)
        {
            console.error('Trying to create vehicle without raycastVehicleComponent');
        }
        else
        {
            this.world = world;
            world.vehicles.push(this);
            world.graphicsWorld.add(this);
            // world.physicsWorld.addBody(this.collision);
            this.rayCastVehicle.addToWorld(world.physicsWorld);
            // world.graphicsWorld.add(this.help);


            // this.materials.forEach((mat) =>
            // {
            //     world.csm.setupMaterial(mat);
            // });
        }
    }

    public removeFromWorld(world: World): void
    {
        if (!_.includes(world.vehicles, this))
        {
            console.warn('Removing character from a world in which it isn\'t present.');
        }
        else
        {
            this.world = undefined;
            _.pull(world.vehicles, this);
            world.graphicsWorld.remove(this);
            world.physicsWorld.remove(this.collision);
        }
    }

    public readVehicleData(gltf: any): void
    {
        gltf.scene.traverse((child) => {

            if (child.isMesh)
            {
                Utils.setupMeshProperties(child);

                if (child.material !== undefined)
                {
                    this.materials.push(child.material);
                }
            }

            if (child.hasOwnProperty('userData'))
            {
                if (child.userData.hasOwnProperty('data'))
                {
                    
                    if (child.userData.data === 'camera')
                    {
                        this.camera = child;
                    }
                    
                    if (child.userData.data === 'collision')
                    {
                        if (child.userData.shape === 'box')
                        {
                            child.visible = false;

                            let phys = new CANNON.Box(new CANNON.Vec3(child.scale.x, child.scale.y, child.scale.z));
                            phys.collisionFilterMask = ~CollisionGroups.TrimeshColliders;
                            this.collision.addShape(phys, new CANNON.Vec3(child.position.x, child.position.y, child.position.z));
                        }
                        else if (child.userData.shape === 'sphere')
                        {
                            child.visible = false;

                            let phys = new CANNON.Sphere(child.scale.x);
                            phys.collisionFilterGroup = CollisionGroups.TrimeshColliders;
                            this.collision.addShape(phys, new CANNON.Vec3(child.position.x, child.position.y, child.position.z));
                        }
                    }
                    if (child.userData.data === 'navmesh')
                    {
                        child.visible = false;
                    }
                }
            }
        });

        if (this.collision.shapes.length === 0)
        {
            console.warn('Vehicle ' + typeof(this) + ' has no collision data.');
        }
        
    }
}
