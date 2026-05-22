<template>
  <div class="zebra">
    <div class="eyes" />
    <div class="face-top">
      <div class="face-btm" />
    </div>
    <div class="ears">
      <div class="stripes2" />
      <div class="stripes3" />
      <div class="stripes4" />
      <div class="stripes5" />
      <div class="stripes6" />
    </div>
    <div class="stripes" />
    <div class="body" />
    <div class="legs" />
  </div>
</template>

<script>
export default {
  setup () {
    return {}
  }
}
</script>

<style lang="scss">
:root {
  --dark-bg-color: #37474F;
  --body-bg-color: #B0BEC5;
}

.zebra {
  position: absolute;
  width: 140px;
  height: 200px;
  // top:20%;
  right:calc(50% - 70px);
}
.face-top {
  background: var(--body-bg-color);
  position: absolute;
  top: 0;
  left:0;
  border-radius: 100%;
  width: 140px;
  height: 160px;
  overflow: hidden;
  animation: float 2s infinite;
}
.face-btm {
  background: var(--dark-bg-color);
  position: absolute;
  top: 80px;
  left:calc(50% - 80px);
  border-radius: 100%;
  width: 160px;
  height: 100px;
}
.face-btm:before, .face-btm:after {
  content: "";
  background:  var(--body-bg-color);
  position: absolute;
  top: 15px;
  border-radius: 100%;
  width: 15px;
  height: 10px;
  animation: scale 2s infinite;
}
.face-btm:before {
  left: calc(50% - 30px);
}

.face-btm:after {
  left: calc(50% + 20px);
}

.eyes {
  position: absolute;
  top: 0;
  left:0;
  width: 140px;
  height: 160px;
  z-index: 10;
  animation: blink 2s infinite
}

.eyes:before, .eyes:after {
    content: "";
    background: var(--dark-bg-color);
    position: absolute;
    top: 25px;
    border-radius: 100%;
    width: 15px;
    height: 15px;
}

.eyes:before {
  left: calc(50% - 20px);
}

.eyes:after {
    left: calc(50% + 10px);
}

.ears {
  position: absolute;
  top: 0;
  left:0;
  width: 140px;
  height: 160px;
  z-index: 10;
  animation: float 2s infinite;
}

.ears:before, .ears:after {
    content: "";
    background: var(--dark-bg-color);
    position: absolute;
    top: 0;
    width: 40px;
    height: 25px;
}

.ears:before {
    left: -5px;
    border-radius: 5px 20px/5px 20px;
}

.ears:after {
    right: -5px;
    border-radius: 20px 5px / 20px 5px;
}

.stripes, .stripes2, .stripes3 {
  position: absolute;
  top: 0;
  left:0;
  border-radius: 100%;
  width: 140px;
  height: 160px;
  overflow: hidden;
  animation: float 2s infinite;
}

.stripes:before, .stripes:after {
    content: "";
    background: transparent;
    position: absolute;
    top: 30px;
    width: 40px;
    border-radius: 50%;
    height: 25px;
    border-top: 10px solid var(--dark-bg-color);
}

.stripes:before {
    left: -5px;
}

.stripes:after {
    right: -5px;
}

.stripes2:before, .stripes2:after {
    content: "";
    background: transparent;
    position: absolute;
    top: 50px;
    width: 50px;
    border-radius: 50%;
    height: 25px;
    border-top: 10px solid var(--dark-bg-color);
}
.stripes2:before {
    left: -5px;
    transform: rotate(-15deg);
}

.stripes2:after {
    right: -5px;
    transform: rotate(15deg);
}

.stripes3:before, .stripes3:after {
    content: "";
    background: transparent;
    position: absolute;
    top: 70px;
    width: 60px;
    border-radius: 50%;
    height: 25px;
    border-top: 10px solid var(--dark-bg-color);
}
.stripes3:before {
    left: -5px;
    transform: rotate(-15deg);
}

.stripes3:after {
    right: -5px;
    transform: rotate(15deg);
}

.body {
    background: var(--body-bg-color);
    position: absolute;
    top: 135px;
    left: -19px;
    border-radius: 50%;
    width: 176px;
    height: 160px;
    overflow: hidden;
    animation: scale2 2s infinite;
}

.stripes4, .stripes5, .stripes6 {
    position: absolute;
    top: 135px;
    left: -19px;
    border-radius: 50%;
    width: 176px;
    height: 160px;
    overflow: hidden;
    animation: scale2 2s infinite;
}

.stripes4:before, .stripes4:after {
    content: "";
    background: transparent;
    position: absolute;
    top: 30px;
    width: 60px;
    border-radius: 50%;
    height: 25px;
    border-top: 10px solid var(--dark-bg-color);
}

.stripes4:before {
    left: -5px;
    transform: rotate(-15deg);
}

.stripes4:after {
    right: -5px;
    transform: rotate(15deg);
}

.stripes5:before, .stripes5:after {
    content: "";
    background: transparent;
    position: absolute;
    top: 60px;
    width: 70px;
    border-radius: 50%;
    height: 25px;
    border-top: 15px solid var(--dark-bg-color);
}

.stripes5:before {
    left: -5px;
    transform: rotate(-15deg);
}

.stripes5:after {
    right: -5px;
    transform: rotate(15deg);
}

.stripes6:before, .stripes6:after {
    content: "";
    background: transparent;
    position: absolute;
    top: 90px;
    width: 70px;
    border-radius: 50%;
    height: 25px;
    border-top: 18px solid var(--dark-bg-color);
}

.stripes6:before {
    left: -5px;
    transform: rotate(-15deg);
}

.stripes6:after {
    right: -5px;
    transform: rotate(15deg);
}

.legs {
    position: absolute;
    top: 135px;
    left: -19px;
    border-radius: 50%;
    width: 176px;
    height: 160px;
}

.legs:before, .legs:after {
    content: "";
    background: repeating-linear-gradient(to bottom, var(--dark-bg-color), var(--dark-bg-color) 10px,
      var(--body-bg-color) 10px, var(--body-bg-color) 20px );
    position: absolute;
    top: 144px;
    width: 27px;
    height: 66px;
}
.legs:before {
    left: 50px;
}

.legs:after {
    right: 50px;
}

@keyframes blink {
  0%, 49%, 60%, 100% {opacity: 1}
  50%,59% {opacity: 0}
}

@keyframes scale {
  0%,100% {transform: scale(1)}
  50%{transform: scale(1.2)}
}

@keyframes scale2 {
  0%,100% {transform: scale(1)}
  50%{transform: scale(1.1)}
}

@keyframes float {
  0%,100% {transform: translate(0, 0)}
  50%{transform: translate(0, -5px)}
}
</style>
