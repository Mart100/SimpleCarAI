import { Vector2 } from "./vector";

interface Camera {
	pos: Vector2
	zoom: number
	lockCar: number|null
}

interface RaceTrack {
	points: Vector2[]
	curvePoints: number[]
	curvePointsVecs: Vector2[]
	outerPoints: Vector2[]
	innerPoints: Vector2[]
}

interface Car {
	pos: Vector2
	vel: number
	dir: number
	control: 'ai' | 'human' | 'bot' | 'none'
	steer: number
	color: [number, number, number]
	sensors: number[]
	controls: {
		accelerate: boolean
		brake: boolean
		steer: number
	},
	brain?: NeuralNetwork
	sensorConfig: Vector2[]
	progress: number
	lap: number
	crashed: boolean
	completedTime?: number
}

interface NeuralNetwork {
	weights: number[][][]
	biases: number[][]
	inputLayer: number[]
	outputLayer: number[]
	hiddenLayers: number[][] 
}

interface GenerationInfo {
	bestFitness: number
	averageFitness: number
	generation: number
	tick: number
	bestTime: number
}