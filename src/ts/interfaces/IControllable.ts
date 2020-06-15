// import { Character } from '../characters/Character';
import { IInputReceiver } from './IInputReceiver';
import { VehicleSeat } from '../vehicles/VehicleSeat';
import { Helicopter } from '../vehicles/Helicopter';

export interface IControllable extends IInputReceiver
{
    seats: VehicleSeat[];
    position: THREE.Vector3;
    // controllingCharacter: Character;

    getMountPoint(character: Helicopter): THREE.Vector3;
    triggerAction(actionName: string, value: boolean): void;
    resetControls(): void;
    allowSleep(value: boolean): void;
}
