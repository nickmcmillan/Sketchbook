import '../css/dat.gui.css';
import '../css/main.css';
import * as THREEImport from 'three';
import * as CANNONImport from 'cannon';


import { BoxPhysics } from './objects/object_physics/BoxPhysics';
import { CapsulePhysics } from './objects/object_physics/CapsulePhysics';
import { ConvexPhysics } from './objects/object_physics/ConvexPhysics';
import { SpherePhysics } from './objects/object_physics/SpherePhysics';
// import { TrimeshPhysics } from './objects/object_physics/TrimeshPhysics';
export const ObjectPhysics = {
    BoxPhysics,
    CapsulePhysics,
    ConvexPhysics,
    SpherePhysics,
    // TrimeshPhysics,
};


export { KeyBinding } from './core/KeyBinding';
export { SBObject } from './objects/SBObject';
export { World } from './core/World';

export let THREE = THREEImport;
export let CANNON = CANNONImport;
export { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
export { LoadingManager } from './core/LoadingManager';
