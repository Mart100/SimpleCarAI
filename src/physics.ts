import { findNearestBorderLines, lineIntersects } from "./cardinalSpine";
import { cars, getCarControl, paused, raceTrack, raceTrackSegments } from "./main";
import { feedForward } from "./neuralnet";
import { evolutionSettings, generation, generationsInfo, newGeneration } from "./neuroEvolution";
import { camera } from "./renderer";
import { Car } from "./types";
import { keys } from "./userInput";
import { Vector2 } from "./vector";

let lastTick = performance.now()
export let totalTicks = 0
let previousProgress = 0

export function tick() {

	let now = performance.now()
	let delta = now - lastTick

	let hasAi = cars.find(car => car.control === 'ai') !== undefined
	if(hasAi) delta = 50
	lastTick = now

	if(paused) return

	totalTicks++

	inputProcessing()

	if(camera.lockCar !== null) correctCameraLock()

	let totalMovement = 0
	let totalProgress = 0

	for (let car of cars) {
		totalProgress += car.progress
		if(car.crashed) continue
		if(car.control === 'bot') controlCarByBot(car)
		else if(car.control === 'ai') controlCarByAI(car)

		carControls(car, delta/20)
		carSensorDetection(car)
		carCollisionDetection(car)
		carCalculateProgress(car)

		totalMovement += Math.abs(car.vel)
		car.pos.add(new Vector2(car.vel, 0).rotate(car.dir))
		car.vel *= (1 - (0.00015 * delta)) // friction
		car.dir += car.steer
		if(car.dir < 0) car.dir += Math.PI * 2
		if(car.dir > Math.PI * 2) car.dir -= Math.PI * 2
	}

	if(generation !== null) {
		let lastGeneration = generationsInfo[generationsInfo.length-1]
		let ticksSinceLastGeneration = totalTicks - lastGeneration.tick
		if(ticksSinceLastGeneration > evolutionSettings.generationDuration || (ticksSinceLastGeneration > 100 && totalMovement < 1)) {
			let newProgress = totalProgress - previousProgress
			if(newProgress > 0.5 || totalMovement > 4) evolutionSettings.generationDuration += 10
			else newGeneration()
		}
	}

	previousProgress = totalProgress
}

function controlCarByAI(car: Car) {
	let brain = car.brain!

	let inputs = []

	for (let sensor of car.sensors) inputs.push(sensor)
	inputs.push(car.vel / 5)
	inputs.push(Math.sin(car.dir))

	let outputs = feedForward(brain, inputs)

	car.controls = { 
		accelerate: outputs[0] > 0.9, 
		brake: outputs[1] > 0.9, 
		steer: Math.max(Math.min(outputs[2], 1), 0),
	}
}

function controlCarByBot(car: Car) {

	car.controls = { accelerate: false, brake: false, steer: 0.5 }
	let controls = car.controls

	if(car.vel < 1) {
		controls.accelerate = true
		controls.brake = false
	}

	if(car.sensors[1] < 0.5) {
		controls.steer = 0
	} else if(car.sensors[3] < 0.5) {
		controls.steer = 1
	}

}

export function correctCameraLock() {
	let carPos = cars[camera.lockCar!].pos.clone().multiply(new Vector2(-1*camera.zoom))
	camera.pos = carPos.add(new Vector2(window.innerWidth/2, window.innerHeight/2))
}

function carCalculateProgress(car: Car) {
	let carPos = car.pos.clone()

	let closestDistance = Infinity
	let closestPointIndex = 0
	let points = raceTrack.curvePointsVecs
	for (let pointIdx in points) {
		let point = points[pointIdx]
		let distance = point.distance(carPos)
		if(distance < closestDistance) {
			closestDistance = distance
			closestPointIndex = +pointIdx
		}
	}

	let pointToNextPoint = points[(closestPointIndex+1)%points.length].distance(points[closestPointIndex])
	let distanceToNextPoint = points[(closestPointIndex+1)%points.length].distance(carPos)

	let smollProgress = Math.round((distanceToNextPoint/pointToNextPoint)*10)/10
	let newProgress = (((closestPointIndex-raceTrackSegments)+points.length)%points.length) + smollProgress

	if(newProgress < car.progress) {
		if(car.progress - newProgress > points.length-10) {
			car.lap++
			
			if(car.lap == 3) {
				let lastGeneration = generationsInfo[generationsInfo.length-1]
				let ticksSinceLastGeneration = totalTicks - lastGeneration.tick
				car.completedTime = ticksSinceLastGeneration
				car.crashed = true
			}
		}
		else return
	}
	if(newProgress - car.progress > 10) return
	car.progress = newProgress
}

function carSensorDetection(car: Car) {
	
	let nearbyLines: [Vector2, Vector2][] = findNearestBorderLines(car.pos, 50)

	let carPos = car.pos.clone()
	let carDir = car.dir

	let sensors = car.sensorConfig.map(sensor => { return [carPos, sensor.clone().rotate(carDir).clone().add(carPos)] })
	let sensorUpdated = sensors.map(_ => false)

	for (let line of nearbyLines) {
		for (let sensorIdx in sensors) {
			let sensor = sensors[sensorIdx]
			let intersection = lineIntersects(line[0], line[1], sensor[0], sensor[1])
			if(intersection) {
				let distance = intersection.distance(carPos) / sensor[0].distance(sensor[1])
				if(sensorUpdated[sensorIdx] && distance > car.sensors[sensorIdx]) continue
				car.sensors[sensorIdx] = distance
				sensorUpdated[sensorIdx] = true
			}
		}
	}

	for(let sensor in sensorUpdated) if(sensorUpdated[sensor] == false) car.sensors[sensor] = 1
}

function carCollisionDetection(car: Car) {

	let nearbyLines: [Vector2, Vector2][] = findNearestBorderLines(car.pos, 8)


	let carPos = car.pos.clone()
	let carDir = car.dir

	let car1 = carPos.clone().add(new Vector2(2, 1).rotate(carDir))
	let car2 = carPos.clone().add(new Vector2(-2, 1).rotate(carDir))
	let car3 = carPos.clone().add(new Vector2(2, -1).rotate(carDir))
	let car4 = carPos.clone().add(new Vector2(-2, -1).rotate(carDir))

	let carLines = [[car1, car2], [car2, car3], [car3, car4], [car4, car1]]

	for (let line of nearbyLines) {
		for (let carLine of carLines) {
			if(lineIntersects(line[0], line[1], carLine[0], carLine[1])) {
				car.vel = 0
				car.steer = 0
				car.crashed = true
				return
			}
		}
	}

}

function carControls(car: Car, delta: number) {
	
	let controls = car.controls
	if(controls.accelerate) car.vel += 0.01 * delta
	if(controls.brake) {
		if(car.vel > 0.04) car.vel -= 0.02 * delta
		else car.vel -= 0.001 * delta
	}
	car.steer = (controls.steer-0.5) * 0.05 * delta

}


function inputProcessing() {

	let carControl = getCarControl()

	if(carControl !== null) {
		let car = cars[carControl]
		let controls = car.controls

		controls.accelerate = keys['w'] ? true : false
		controls.brake = keys['s'] ? true : false
		if(keys['a'] == keys['d']) controls.steer = 0.5
		else if(keys['a']) controls.steer = 0
		else if(keys['d']) controls.steer = 1
	}

}