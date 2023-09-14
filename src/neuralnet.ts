import { defaultCarSensors } from "./main"
import { evolutionSettings } from "./neuroEvolution"
import { NeuralNetwork } from "./types"
import { gaussianRandom } from "./utils"

export function createCarNeuralNetwork() {
	
	let neuralNetwork:NeuralNetwork = {
		biases: [],
		weights: [],
		inputLayer: [],
		outputLayer: [],
		hiddenLayers: []
	}

	for(let i = 0; i < defaultCarSensors.length+2; i++) neuralNetwork.inputLayer.push(0) // x sensors. 4 speed. 5 direction.
	for(let i = 0; i < 3; i++) neuralNetwork.outputLayer.push(0) // 1 steering. 3 acceleration. 4 brake.

	for(let i = 0; i < 1; i++) {
		neuralNetwork.hiddenLayers.push([])
		for(let j = 0; j < evolutionSettings.hiddenLayerNodes; j++) {
			neuralNetwork.hiddenLayers[i].push(0)
		}
	}

	let layers = [neuralNetwork.inputLayer, ...neuralNetwork.hiddenLayers, neuralNetwork.outputLayer]

	for(let i = 0; i < layers.length - 1; i++) {
		neuralNetwork.weights.push([])
		neuralNetwork.biases.push([])
		for(let j = 0; j < layers[i].length; j++) {
			neuralNetwork.weights[i].push([])
			neuralNetwork.biases[i].push(Math.random() * 2 - 1)
			for(let k = 0; k < layers[i+1].length; k++) {
				neuralNetwork.weights[i][j].push(Math.random() * 2 - 1)
			}
		}
	}

	return neuralNetwork
}

export function copyNeuralNetwork(nn: NeuralNetwork) {
	let copy = createCarNeuralNetwork()
	for(let i = 0; i < copy.weights.length; i++) {
		for(let j = 0; j < copy.weights[i].length; j++) {
			for(let k = 0; k < copy.weights[i][j].length; k++) {
				copy.weights[i][j][k] = nn.weights[i][j][k]
			}
			copy.biases[i][j] = nn.biases[i][j]
		}
	}
	return copy
}
	

export function feedForward(nn: NeuralNetwork, input: number[]) {
	for(let i = 0; i < input.length; i++) nn.inputLayer[i] = input[i]

	let layers = [nn.inputLayer, ...nn.hiddenLayers, nn.outputLayer]
	for(let i = 1; i < layers.length; i++) {
		for(let j = 0; j < layers[i].length; j++) {
			let sum = 0
			for(let k = 0; k < layers[i-1].length; k++) {
				sum += layers[i-1][k] * nn.weights[i-1][k][j]
			}
			sum += nn.biases[i-1][j]
			layers[i][j] = sigmoid(sum)
		}
	}

	return nn.outputLayer
}


export function createOffspring(nn1: NeuralNetwork, nn2: NeuralNetwork) {
	let offspring = createCarNeuralNetwork()

	for(let i = 0; i < offspring.weights.length; i++) {
		for(let j = 0; j < offspring.weights[i].length; j++) {
			for(let k = 0; k < offspring.weights[i][j].length; k++) {
				offspring.weights[i][j][k] = Math.random() > 0.5 ? nn1.weights[i][j][k] : nn2.weights[i][j][k]
			}
			offspring.biases[i][j] = Math.random() > 0.5 ? nn1.biases[i][j] : nn2.biases[i][j]
		}
	}

	return offspring
}

export function brainToJson(nn: NeuralNetwork) {
	return JSON.stringify({
		weights: nn.weights,
		biases: nn.biases
	})
}	

export function brainFromJson(json: string) {
	let nn = createCarNeuralNetwork()
	let data = JSON.parse(json)
	for(let i = 0; i < nn.weights.length; i++) {
		for(let j = 0; j < nn.weights[i].length; j++) {
			for(let k = 0; k < nn.weights[i][j].length; k++) {
				nn.weights[i][j][k] = data.weights[i][j][k]
			}
			nn.biases[i][j] = data.biases[i][j]
		}
	}

	return nn
}

export function mutate(nn: NeuralNetwork, mutationRate: number) {
	for(let i = 0; i < nn.weights.length; i++) {
		for(let j = 0; j < nn.weights[i].length; j++) {
			for(let k = 0; k < nn.weights[i][j].length; k++) {
				nn.weights[i][j][k] += gaussianRandom(0, 0.1)*mutationRate
			}
			nn.biases[i][j] += gaussianRandom(0, 0.1)*mutationRate
		}
	}
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z))
}