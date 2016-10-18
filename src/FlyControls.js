/* eslint comma-dangle: ["error", "only-multiline"]*/
/* global document:false, window:false */

import * as THREE from 'three';

/**
 * @author James Baicoianu / http://www.baicoianu.com/ (original)
 *
 * Refactored later
 *
 */

class FlyControls {
  constructor(object, domElement) {
    this.object = object;

    this.domElement = (domElement !== undefined) ? domElement : document;
    if (domElement) this.domElement.setAttribute('tabindex', -1);

    // API
    // this.movementBounds;
    this.movementMax = 300;
    this.movementMin = 30;
    this.movementIncrement = 10;
    this.movementSpeed = 1.0;
    this.rollSpeed = 20;

    this.dragToLook = false;
    this.autoForward = false;

    // disable default target object behavior

    // internals

    this.tmpQuaternion = new THREE.Quaternion();

    this.mouseStatus = 0;
    this.touchStatus = 0;

    this.moveState = {
      up: 0,
      down: 0,
      left: 0,
      right: 0,
      forward: 0,
      back: 0,
      pitchUp: 0,
      pitchDown: 0,
      yawLeft: 0,
      yawRight: 0,
      rollLeft: 0,
      rollRight: 0,
    };

    this.temporaryMoveState = { yawLeft: 0, yawRight: 0, forward: 0, back: 0 };
    this.temporaryMoveDistance = 20;
    this.temporaryYawDistance = 75;
    this.moveVector = new THREE.Vector3(0, 0, 0);
    this.rotationVector = new THREE.Vector3(0, 0, 0);
    this.dragStart = new THREE.Vector2(0, 0);

    this.touchPitchMultipler = 3;
    this.touchYawMultiplier = 3;

    this.preventDefault = function preventDefault(event) { event.preventDefault(); };
    this.preventDefault = this.preventDefault.bind(this);
    this.mousemove = this.mousemove.bind(this);
    this.mousedown = this.mousedown.bind(this);
    this.mouseup = this.mouseup.bind(this);
    this.keydown = this.keydown.bind(this);
    this.keyup = this.keyup.bind(this);

    this.touchstart = this.touchstart.bind(this);
    this.touchend = this.touchend.bind(this);
    this.touchmove = this.touchmove.bind(this);

    this.mouseclick = this.mouseclick.bind(this);

    this.domElement.addEventListener('contextmenu', this.preventDefault, false);

    this.domElement.addEventListener('mousemove', this.mousemove, false);
    this.domElement.addEventListener('mousedown', this.mousedown, false);
    this.domElement.addEventListener('mouseup', this.mouseup, false);

    this.domElement.addEventListener('click', this.mouseclick, false);

    this.domElement.addEventListener('touchstart', this.touchstart, false);
    this.domElement.addEventListener('touchend', this.touchend, false);
    this.domElement.addEventListener('touchmove', this.touchmove, false);

    window.addEventListener('keydown', this.keydown, false);
    window.addEventListener('keyup', this.keyup, false);

    this.updateMovementVector();
    this.updateRotationVector();
  }

  dispose() {
    this.object = null;
    this.domElement.removeEventListener('contextmenu', this.preventDefault, false);

    this.domElement.removeEventListener('mousemove', this.mousemove, false);
    this.domElement.removeEventListener('mousedown', this.mousedown, false);
    this.domElement.removeEventListener('mouseup', this.mouseup, false);

    this.domElement.removeEventListener('click', this.mouseclick, false);

    this.domElement.removeEventListener('touchstart', this.touchstart, false);
    this.domElement.removeEventListener('touchend', this.touchend, false);
    this.domElement.removeEventListener('touchmove', this.touchmove, false);

    this.domElement = null;

    window.removeEventListener('keydown', this.keydown, false);
    window.removeEventListener('keyup', this.keyup, false);
  }

  resetTemporaryMoveState() {
    this.temporaryMoveState = { yawLeft: 0, yawRight: 0, forward: 0, back: 0 };

    this.updateMovementVector();
    this.updateRotationVector();
  }

  touchstart(event) {
    if (this.dragToLook) {
      this.touchStatus += 1;
      this.dragStart.set(event.touches[0].pageX, event.touches[0].pageY);
    }
  }

  touchend() {
    if (this.dragToLook) {
      this.touchStatus -= 1;
      this.moveState.forward = 0;

      this.moveState.yawLeft = this.moveState.pitchDown = 0;
      this.moveState.left = 0;
      this.moveState.back = 0;
      this.moveState.up = 0;
      this.moveState.down = 0;
    }

    this.updateMovementVector();
    this.updateRotationVector();
  }

  touchmove(event) {
    // console.log('touchmove');
    // console.log(event);
    if (this.touchStatus > 0) {
      event.preventDefault();
      if (event.touches.length === 1) {
        this.orbitYawPitch(event.touches[0].pageX, event.touches[0].pageY);
        // this.moveState.yawLeft =
        //   - ((event.touches[0].pageX - container.offset[0]) - halfWidth) / halfWidth;
        // this.moveState.pitchDown =
        //   ((event.touches[0].pageY - container.offset[1]) - halfHeight) / halfHeight;
        // this.moveState.yawLeft *= this.touchYawMultiplier;
        // this.moveState.pitchDown *= this.touchPitchMultipler;

        if (this.moveState.pitchDown < 0) {
          // // this.moveState.up = 1;
          // this.moveState.down = 0;
        } else {
          // this.moveState.down = 1;
          // this.moveState.up = 0;
        }
      } else {
        this.moveState.yawLeft = 0;
        this.moveState.pitchDown = 0;
      }
      this.updateRotationVector();
      this.updateMovementVector();
    }
  }

  keydown(event) {
    if (event.altKey) {
      return;
    }

    switch (event.keyCode) {

      default: break;

      case 73: /* I */ break;
      case 74: /* J */ break;
      case 75: /* K */ break;
      case 76: /* L */ break;

      case 16: /* shift */ this.movementSpeedMultiplier = 0.1; break;

      case 87: /* W*/ this.moveState.forward = 1; break;
      case 83: /* S*/ this.moveState.back = 1; break;

      case 65: /* A*/ this.moveState.left = 1; break;
      case 68: /* D*/ this.moveState.right = 1; break;

      // case 82: /*R*/ this.moveState.up = 1; break;
      // case 70: /*F*/ this.moveState.down = 1; break;
      case 81: /* Q*/ this.moveState.down = 1; break;
      case 69: /* E*/ this.moveState.up = 1; break;

      case 38: /* up*/ this.moveState.pitchUp = 1; break;
      case 40: /* down*/ this.moveState.pitchDown = 1; break;

      case 37: /* left*/ this.moveState.yawLeft = 1; break;
      case 39: /* right*/ this.moveState.yawRight = 1; break;

      // case 81: /*Q*/ this.moveState.rollLeft = 1; break;
      // case 69: /*E*/ this.moveState.rollRight = 1; break;
      case 107:
      case 187:
        if (this.movementSpeed + this.movementIncrement <= this.movementMax) {
          this.movementSpeed += this.movementIncrement;
        }
        break;

      case 109:
      case 189:
        if (this.movementSpeed - this.movementIncrement >= this.movementMin) {
          this.movementSpeed -= this.movementIncrement;
        }
        break;
    }

    this.updateMovementVector();
    this.updateRotationVector();
  }

  keyup(event) {
    switch (event.keyCode) {

      case 73: /* I */ break;
      case 74: /* J */ break;
      case 75: /* K */ break;
      case 76: /* L */ break;

      case 16: /* shift */ this.movementSpeedMultiplier = 1; break;

      case 87: /* W*/ this.moveState.forward = 0; break;
      case 83: /* S*/ this.moveState.back = 0; break;

      case 65: /* A*/ this.moveState.left = 0; break;
      case 68: /* D*/ this.moveState.right = 0; break;

      // case 82: /*R*/ this.moveState.up = 0; break;
      // case 70: /*F*/ this.moveState.down = 0; break;
      case 81: /* Q*/ this.moveState.down = 0; break;
      case 69: /* E*/ this.moveState.up = 0; break;

      case 38: /* up*/ this.moveState.pitchUp = 0; break;
      case 40: /* down*/ this.moveState.pitchDown = 0; break;

      case 37: /* left*/ this.moveState.yawLeft = 0; break;
      case 39: /* right*/ this.moveState.yawRight = 0; break;

      // case 81: /*Q*/ this.moveState.rollLeft = 0; break;
      // case 69: /*E*/ this.moveState.rollRight = 0; break;

      default: break;

    }

    this.updateMovementVector();
    this.updateRotationVector();
  }

  mousedown(event) {
    // console.log('mousedown');

    this.mouseMovementCount = 0;
    if (this.domElement !== document) {
      this.domElement.focus();
    }

    event.preventDefault();
    event.stopPropagation();

    if (this.dragToLook) {
      this.mouseStatus += 1;
      this.dragStart.set(event.pageX, event.pageY);
    } else {
      switch (event.button) {
        case 0: this.moveState.forward = 1; break;
        case 2: this.moveState.back = 1; break;
        default: break;
      }

      this.updateMovementVector();
    }
  }

  mouseclick(event) {
    // console.log('mouseclick');
    if (event.target.localName !== 'canvas') {
      return;
    }

    if (this.shouldSuppressClickHandler()) {
      return;
    }

    if (this.handleClick) {
      this.handleClick(event);
    }
  }

  shouldSuppressClickHandler() {
    return this.mouseMovementCount > 4;
  }


  orbitYawPitch(x, y) {
    // the most you can drag is 33% of the total rotation allowed
    const radiansPerPixel = 1500; // 1208
    const yawValue = -(this.dragStart.x - x) / radiansPerPixel;
    const pitchValue = -(this.dragStart.y - y) / radiansPerPixel;

    this.dragStart.set(x, y);

    // Apply pitch value
    this.rotationVector.x = pitchValue;
    this.rotationVector.y = yawValue;

    this.tmpQuaternion.set(this.rotationVector.x, 0, 0, 1).normalize();
    const camera = this.object.children[0];
    camera.quaternion.multiply(this.tmpQuaternion);
    camera.quaternion.x = THREE.Math.clamp(camera.quaternion.x, -0.7, 2.6);
    camera.quaternion.w = 1;

    this.tmpQuaternion.set(0, this.rotationVector.y, 0, 1).normalize();
    this.object.quaternion.multiply(this.tmpQuaternion);
  }

  mousemove(event) {
    // console.log('mousemove');
    // console.log(event);
    if ((!this.dragToLook || this.mouseStatus > 0)) {
      this.mouseMovementCount += 1;
      if (!this.shouldSuppressClickHandler()) {
        return;
      }
      const container = this.getContainerDimensions();
      const halfWidth = container.size[0] / 2;
      const halfHeight = container.size[1] / 2;

      switch (event.buttons) {
        case 0:
        case 1:
          this.orbitYawPitch(event.pageX, event.pageY);
          // this.moveState.yawLeft =
          //   - ((event.pageX - container.offset[0]) - halfWidth) / halfWidth;
          // this.moveState.pitchDown =
          //   ((event.pageY - container.offset[1]) - halfHeight) / halfHeight;
          // this.updateRotationVector();
          break;
        case 2:
          this.moveState.left = -((event.pageX - container.offset[0]) - halfWidth) / halfWidth;
          this.moveState.back = ((event.pageY - container.offset[1]) - halfHeight) / halfHeight;
          this.updateMovementVector();
          break;
        default: break;
      }
    } else if (event.target.localName === 'canvas') {
      if (this.handleMouseMove) {
        this.handleMouseMove(event);
      }
    }
  }

  mouseup(event) {
    // console.log('mouseup');

    event.preventDefault();
    event.stopPropagation();
    if (this.dragToLook) {
      this.mouseStatus = 0;

      this.moveState.yawLeft = this.moveState.pitchDown = 0;
      this.moveState.left = 0;
      this.moveState.back = 0;
    } else {
      switch (event.button) {
        case 0: this.moveState.forward = 0; break;
        case 2: this.moveState.back = 0; break;
        default: break;
      }
    }
    this.updateMovementVector();
    this.updateRotationVector();
  }

  update(delta) {
    const moveMult = delta * this.movementSpeed;
    const rotMult = delta * this.rollSpeed;

    if (typeof this.movementBounds !== 'undefined') {
      const x = this.object.position.x + (this.moveVector.x * moveMult);
      const y = this.object.position.y + (this.moveVector.y * moveMult);
      const z = this.object.position.z + (this.moveVector.z * moveMult);

      const newPosition = new THREE.Vector3(x, y, z);

      if (this.movementBounds.distanceToPoint(newPosition) === 0) {
        this.object.translateX(this.moveVector.x * moveMult);
        this.object.translateY(this.moveVector.y * moveMult);
        this.object.translateZ(this.moveVector.z * moveMult);
      }

      // if (x >= this.movementBounds.min.x && x <= this.movementBounds.max.x) {
      //   this.object.translateX(this.moveVector.x * moveMult);
      // }
      // if (y >= this.movementBounds.min.y && y <= this.movementBounds.max.y) {
      //   this.object.translateY(this.moveVector.y * moveMult);
      // }
      // if (z >= this.movementBounds.min.z && z <= this.movementBounds.max.z) {
      //   this.object.translateZ(this.moveVector.z * moveMult);
      // }
    } else {
      this.object.translateX(this.moveVector.x * moveMult);
      this.object.translateY(this.moveVector.y * moveMult);
      this.object.translateZ(this.moveVector.z * moveMult);
    }

    // modified to find a camera in the children of the object - jfox
    if (this.object.children.length > 0) {
      // the camera rotates x and z
      this.tmpQuaternion.set(
        this.rotationVector.x * rotMult,
        0,
        this.rotationVector.z * rotMult,
        1).normalize();
      const camera = this.object.children[0];
      camera.quaternion.multiply(this.tmpQuaternion);
      // rig rotates y
      this.tmpQuaternion.set(0, this.rotationVector.y * rotMult, 0, 1).normalize();
      this.object.quaternion.multiply(this.tmpQuaternion);

      // this.lastDebugTime = this.lastDebugTime || Date.now();
      // if (Date.now() - this.lastDebugTime > 2500) {
      //   console.log('rig:');
      //   console.log(this.object.position);
      //   console.log(this.object.rotation);
      //   console.log('camera:');
      //   console.log(camera.rotation);
      //   this.lastDebugTime = Date.now();

      //   let raycaster = new THREE.Raycaster();
      //   raycaster.set(this.object.position, camera.getWorldDirection())
      //   let intersects = raycaster.intersectObjects(this.scene.children, true);
      //   if (intersects.length > 0) {
      //     console.log(intersects[0]);
      //   }
      // }
    } else {
      this.tmpQuaternion.set(
        this.rotationVector.x * rotMult,
        this.rotationVector.y * rotMult,
        this.rotationVector.z * rotMult,
        1).normalize();
      this.object.quaternion.multiply(this.tmpQuaternion);
    }

    this.resetTemporaryMoveState();
  }

  updateMovementVector() {
    let forward = (
      this.moveState.forward ||
      this.temporaryMoveState.forward ||
      (this.autoForward && !this.moveState.back)
    ) ? 1 : 0;

    if (this.temporaryMoveState.forward) {
      forward *= this.temporaryMoveDistance;
    }

    let back = this.moveState.back || this.temporaryMoveState.back;
    if (this.temporaryMoveState.back) {
      back *= this.temporaryMoveDistance;
    }

    this.moveVector.x = (-this.moveState.left || this.moveState.right);
    this.moveVector.y = (-this.moveState.down || this.moveState.up);
    this.moveVector.z = (-forward || back);
  }

  updateRotationVector() {
    this.rotationVector.x = (-this.moveState.pitchDown + this.moveState.pitchUp);
    this.rotationVector.y =
      (-this.moveState.yawRight + this.moveState.yawLeft) +
      ((-this.temporaryMoveState.yawRight + this.temporaryMoveState.yawLeft) *
        this.temporaryYawDistance);
    this.rotationVector.z = (-this.moveState.rollRight + this.moveState.rollLeft);
  }

  getContainerDimensions() {
    if (this.domElement !== document) {
      return {
        size: [this.domElement.offsetWidth, this.domElement.offsetHeight],
        offset: [this.domElement.offsetLeft, this.domElement.offsetTop],
      };
    }

    return {
      size: [window.innerWidth, window.innerHeight],
      offset: [0, 0],
    };
  }
}

export default FlyControls;
