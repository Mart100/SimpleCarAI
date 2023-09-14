import { cars, createCar, getCarControl, loadedAI, paused, raceTrack, regerenateTrack, setCarControl, setLoadedAi, setPaused, setTicksPerSecond, toScreen, toWorld } from "./main"
import { brainFromJson, brainToJson, copyNeuralNetwork, createCarNeuralNetwork } from "./neuralnet"
import { startEvolution } from "./neuroEvolution"
import { correctCameraLock } from "./physics"
import { camera } from "./renderer"
import { Vector2 } from "./vector"

let dragging: { is: boolean, origin: Vector2, camPos: Vector2 } = { is: false, origin: new Vector2(0, 0), camPos: new Vector2(0, 0) }
export const keys: { [key: string]: boolean } = {}

export function createInputListeners() {

	const canvas = document.getElementById('canvas') as HTMLCanvasElement

	canvas.addEventListener('wheel', (event) => {

		event.preventDefault()

		let zoomFactor
		if (event.deltaY > 0) zoomFactor = 0.9
		else zoomFactor = 1.1

		camera.zoom *= zoomFactor

		if(camera.lockCar !== null) {
			correctCameraLock()
			return
		}

		let mousePos = new Vector2(event.offsetX, event.offsetY)
		let mousePosWorld = toWorld(mousePos)
		let newMousePosWorld = mousePosWorld.clone().multiply(new Vector2(zoomFactor))

		let diff = mousePosWorld.subtract(newMousePosWorld)
		camera.pos = toScreen(diff)

	}, false)

	canvas.addEventListener('mousedown', (event) => {
		dragging.is = true
		dragging.origin = new Vector2(event.offsetX, event.offsetY)
		dragging.camPos = camera.pos.clone()
	})

	canvas.addEventListener('mouseup', () => {
		dragging.is = false
	})

	canvas.addEventListener('click', (event) => {
		let mousePos = new Vector2(event.offsetX, event.offsetY)

		// check if mouse on a car
		for (let i = 0; i < cars.length; i++) {
			let car = cars[i]
			let carPos = toScreen(car.pos)
			if (mousePos.distance(carPos) < camera.zoom*2) {
				camera.zoom = 10
				camera.lockCar = i
				correctCameraLock()
				if(car.control == 'ai') {
					document.getElementById('saveaibtn')!.style.display = 'block'
				}
				return
			}
		}

		document.getElementById('saveaibtn')!.style.display = 'none'
		camera.lockCar = null

	})

	canvas.addEventListener('mouseleave', () => {
		dragging.is = false
	})


	canvas.addEventListener('mousemove', (event) => {
		if (dragging.is) {
			if(getCarControl() !== null) return
			if(camera.lockCar != null) return
			let mousePosOffset = new Vector2(event.offsetX, event.offsetY).subtract(dragging.origin)
			camera.pos = dragging.camPos.clone().add(mousePosOffset)
		}
	})

	document.addEventListener('keydown', (event) => {
    keys[event.key] = true

		console.log(event.key)
		if(event.key == ' ') setPaused(!paused)
		if(paused) {
			canvas.classList.add('paused')
			document.getElementById('paused')!.style.display = 'block'
		}
		else {
			canvas.classList.remove('paused')
			document.getElementById('paused')!.style.display = 'none'
		}
	})

	document.addEventListener('keyup', (event) => {
    keys[event.key] = false
	})


	// buttons

	document.getElementById('gentrackbtn')!.addEventListener('click', () => {
		regerenateTrack()
	})

	document.getElementById('controlcarbtn')!.addEventListener('click', () => {
		
		let car = createCar('human')
		let idx = cars.push(car)-1

		camera.zoom = 10
		camera.lockCar = idx
		setCarControl(idx)
	})

	document.getElementById('freeflybtn')!.addEventListener('click', () => {
		camera.lockCar = null
		setCarControl(null)
	})

	document.getElementById('spawnbotbtn')!.addEventListener('click', () => {
		let car = createCar('bot')
		cars.push(car)
	})

	document.getElementById('spawnaibtn')!.addEventListener('click', () => {
		let car = createCar('ai')
		if(loadedAI !== null) car.brain = copyNeuralNetwork(loadedAI)
		else car.brain = createCarNeuralNetwork()
		let idx = cars.push(car)-1

		camera.zoom = 10
		camera.lockCar = idx
	})

	document.getElementById('startevobtn')!.addEventListener('click', () => {
		startEvolution()
		camera.zoom = 10
		let startPos = raceTrack.points[0].clone().multiply(new Vector2(camera.zoom*-1))
		camera.pos = startPos.add(new Vector2(window.innerWidth/2, window.innerHeight/2))
		hideButton('startevobtn')
	})

	document.getElementById('speedrange')!.addEventListener('input', function() {
		let value = (this as any).value
		let tps = 0
		if(value < 25) tps = ((value)/25) * 10
		else if(value < 50) tps = ((value-24)/25) * 100
		else if(value < 75) tps = ((value-49)/25) * 1000
		else if(value < 100) tps = ((value-74)/25) * 10000
		else tps = 10000

		setTicksPerSecond(tps)
	})

	document.getElementById('saveaibtn')!.addEventListener('click', () => {
		let car = cars[camera.lockCar!]
		let json = brainToJson(car.brain!)
		localStorage.setItem('ai', json)
	})

	document.getElementById('loadaibtn')!.addEventListener('click', () => {
		let json = localStorage.getItem('ai')!
		localStorage.setItem('ai', json)
		let nn = brainFromJson(json)
		setLoadedAi(nn)
	})
}
type Button = 'gentrackbtn' | 'controlcarbtn' | 'freeflybtn' | 'spawnbotbtn' | 'spawnaibtn' | 'startevobtn' | 'saveaibtn'

export function showButton(button: Button) {
	document.getElementById(button)!.style.display = 'block'
}

export function hideButton(button: Button) {
	document.getElementById(button)!.style.display = 'none'
}


