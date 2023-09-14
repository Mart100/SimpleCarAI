import { cars, createCar, loadedAI, raceTrack, resetCar } from "./main"
import { copyNeuralNetwork, createCarNeuralNetwork, createOffspring, mutate } from "./neuralnet"
import { totalTicks } from "./physics"
import { camera } from "./renderer"
import { Car, GenerationInfo, NeuralNetwork } from "./types"
import { showButton } from "./userInput"
import { gaussianRandom } from "./utils"
import { Vector2 } from "./vector"

export let generation: null|number = null
export const generationsInfo:GenerationInfo[] = []
export const evolutionSettings = {
	generationDuration: 200,
	carAmount: 50,
	hiddenLayerNodes: 6,
}

export function startEvolution() {

	let amount = evolutionSettings.carAmount
	generation = 0
	let aicars: Car[] = []

	for (let i = 0; i < amount; i++) {

		let car = createCar('ai')
		if(loadedAI !== null) car.brain = copyNeuralNetwork(loadedAI)
		else car.brain = createCarNeuralNetwork()
		
		cars.push(car)
		aicars.push(car)
	}

	generationsInfo.push({
		generation: generation,
		bestFitness: 0,
		averageFitness: 0,
		tick: totalTicks,
		bestTime: 0
	})
}

export function cancelEvolution() {
	generation = null
	generationsInfo.length = 0
	showButton('startevobtn')
}

export function newGeneration() {

	if(generation === null) return

	generation!++
	
	let amount = evolutionSettings.carAmount
	let aicars = cars.filter(c => c.control == 'ai')

	let carsByCompletedTime = aicars.filter(c => c.completedTime)
	carsByCompletedTime.sort((a, b) => a.completedTime! - b.completedTime!)
	let bestTime = carsByCompletedTime[0]?.completedTime ?? 0

	let carsByFitness = aicars.sort((a, b) => carFitness(b) - carFitness(a))
	let averageFitness = carsByFitness.reduce((acc, c) => acc + carFitness(c), 0) / carsByFitness.length

	generationsInfo.push({
		generation: generation!,
		bestFitness: carFitness(carsByFitness[0]),
		bestTime,
		averageFitness,
		tick: totalTicks
	})

	console.log('NEW GENERATION', generationsInfo[generationsInfo.length-1])

	let mostFit = carsByFitness.slice(0, 10)
	let newCars = createVariations(mostFit, amount)
	for(let aicarIdx in aicars) {
		aicars[aicarIdx].brain = newCars.brains[aicarIdx]
		aicars[aicarIdx].sensorConfig = newCars.sensors[aicarIdx]
		resetCar(aicars[aicarIdx])
		aicars[aicarIdx].color = [255, 0, 0]
	}
	aicars[0].color = [255, 255, 0]

	if(camera.lockCar !== null) {
		let bestCar = cars.findIndex(c => c == aicars[0])
		camera.lockCar = bestCar
	}
		
}

// function mutateSensorss(sensors: Vector2[], mutationRate: number) {
// 	let newSensors = sensors.map(s => s.clone())
// 	for(let sensor of newSensors) {
// 		sensor.x += (Math.random()-0.5)*mutationRate*gaussianRandom(0, 1)
// 		sensor.y += (Math.random()-0.5)*mutationRate*gaussianRandom(0, 1)
// 	}
// 	return newSensors
// }

// function offspringSensorss(sensors1: Vector2[], sensors2: Vector2[]) {
// 	let newSensors = sensors1.map(s => s.clone())
// 	for(let i = 0; i < newSensors.length; i++) {
// 		let a = Math.random()
// 		newSensors[i].x = a*sensors1[i].x + (1-a)*sensors2[i].x
// 		newSensors[i].y = a*sensors1[i].y + (1-a)*sensors2[i].y
// 	}
// 	return newSensors
// }

function createVariations(bestCars: Car[], amount: number) {

	let newBrains: NeuralNetwork[] = bestCars.map(c => c.brain!)
	let newSensors: Vector2[][] = bestCars.map(c => c.sensorConfig)

	for(let i = 0; i < amount-bestCars.length; i++) {

		let parent1 = bestCars[Math.floor(Math.random()*bestCars.length/2)]
		let parent2 = bestCars[Math.floor(Math.random()*bestCars.length)]

		let offspring = createOffspring(parent1.brain!, parent2.brain!)
		let sensorOffspring = offspringSensors(parent1.sensorConfig, parent2.sensorConfig)

		let mutationRate = Math.random()*5

		mutate(offspring, mutationRate)
		let newSensorConfig = mutateSensors(sensorOffspring, mutationRate)

		newBrains.push(offspring)
		newSensors.push(newSensorConfig)
	}

	return {
		brains: newBrains,
		sensors: newSensors
	}
}

export function carFitness(car: Car) {
	let fitness =  car.progress + raceTrack.curvePoints.length*car.lap
	if(car.completedTime !== undefined) {
		fitness += (10000-car.completedTime)
	}
	return fitness
}

function mutateSensors(sensors: Vector2[], mutationRate: number) {
	let newSensors = sensors.map(s => s.clone())
	for(let sensor of newSensors) {
		sensor.x += (Math.random()-0.5)*mutationRate*gaussianRandom(0, 1)
		sensor.y += (Math.random()-0.5)*mutationRate*gaussianRandom(0, 1)
	}
	return newSensors
}

function offspringSensors(sensors1: Vector2[], sensors2: Vector2[]) {
	let newSensors = sensors1.map(s => s.clone())
	for(let i = 0; i < newSensors.length; i++) {
		let a = Math.random()
		newSensors[i].x = a*sensors1[i].x + (1-a)*sensors2[i].x
		newSensors[i].y = a*sensors1[i].y + (1-a)*sensors2[i].y
	}
	return newSensors
}

