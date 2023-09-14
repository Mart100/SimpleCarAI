import { getCurvePoints, getOffsetPoints } from './cardinalSpine'
import { cancelEvolution } from './neuroEvolution'
import { tick } from './physics'
import { camera, frame } from './renderer'
import './style.scss'
import { Car, NeuralNetwork, RaceTrack } from './types'
import { createInputListeners } from './userInput'
import { Vector2 } from './vector'

export let loadedAI: null|NeuralNetwork = null
export let raceTrackSegments = 20
let processInterval: any = null
export const defaultCarSensors = [new Vector2(10, 30), new Vector2(35, 20), new Vector2(50, 0), new Vector2(35, -20), new Vector2(10, -30)]
//[new Vector2(25, 15), new Vector2(40, 0), new Vector2(25, -15)]
export let paused = false
export let raceTrack:RaceTrack
export const cars: Car[] = []



async function start() {
  raceTrack = await generateRaceTrack()
  console.log('RACETRACK', raceTrack)

  frame()
  createInputListeners()
  setTicksPerSecond(100)
}

start()


export async function regerenateTrack() {
  cars.length = 0
  camera.lockCar = null
  cancelEvolution()
  raceTrack = await generateRaceTrack()
  let carControl = getCarControl()
  if(carControl !== null) resetCar(cars[carControl])
}

async function generateRaceTrack() : Promise<RaceTrack> {

  console.log('GENERATING RACETRACK...')

  let pointAmount = 20
  let points: Vector2[] = []
  for ( let i = 0; i < pointAmount-1; i++ ) {
    let vec = new Vector2(-200 + ((Math.random()-0.5)*100), 0)
    vec.rotate(i * (Math.PI * 2) / pointAmount)
    vec.multiply(new Vector2(2, 1))
    let random = new Vector2(Math.random() * 40, Math.random() * 40)
    vec.add(random)
    points.push(vec)
  }

  // push away from each other
  let moved = true
  let i = 0
  while(moved && i < 20) {
    i++
    moved = false
    for (let i = 0; i < points.length; i++) {
      let p1 = points[i]
      for (let j = 0; j < points.length; j++) {
        if (i == j) continue
        let p2 = points[j]
        let dist = p1.distance(p2)
        if (dist < 100) {
          let dir = p2.clone().subtract(p1).normalize()
          let push = dir.multiply(new Vector2((100 - dist)/2, (100 - dist)/2))
          push.add(new Vector2((Math.random()-0.5) * 10, (Math.random()-0.5) * 10))
          p1.subtract(push)
          p2.add(push)
          moved = true
        }
      }
    }
  }
  if(i == 20) return await generateRaceTrack()

  let curvePoints = getCurvePoints(points.map(p => p.toArray()).flat(), 1, true, raceTrackSegments)

  // check for too sharp angles
  for(let i = 0; i < curvePoints.length; i+=2) {
    let p1 = new Vector2(curvePoints[(i-2)%curvePoints.length], curvePoints[(i-1)%curvePoints.length])
    let p2 = new Vector2(curvePoints[(i  )%curvePoints.length], curvePoints[(i+1)%curvePoints.length])
    let p3 = new Vector2(curvePoints[(i+2)%curvePoints.length], curvePoints[(i+3)%curvePoints.length])
    
    let angle = p2.find3PointAngle(p1, p3)
    if(angle < Math.PI/1.1) {
      console.log(i, ' angle too sharp', angle)
      return await generateRaceTrack()
    }

    let dist = p1.distance(p2)
    if(dist == 0) {
      curvePoints.splice(i, 2)
      i-=2
    }
  }

  let curvePointsVecs = new Array<Vector2>()
  for (let i = 0; i < curvePoints.length; i+=2) curvePointsVecs.push(new Vector2(curvePoints[i], curvePoints[i+1]))

  let innerPoints = getOffsetPoints(curvePointsVecs, 10)
  let outerPoints = getOffsetPoints(curvePointsVecs, -10)

  return { points, curvePoints, outerPoints, innerPoints, curvePointsVecs }
}

export function setTicksPerSecond(tps: number) {
  if(processInterval) clearInterval(processInterval)
  processInterval = setInterval(() => {
    if(tps > 1000) for(let i = 0; i < tps/1000; i++) tick()
    else tick()
  }, 1000/Math.min(tps, 1000))
}

export function setPaused(p:boolean) {
  paused = p
}

export function resetCar(car: Car) {
  car.pos = raceTrack.points[0].clone()
  car.vel = 0
  car.dir = -Math.PI/2
  car.progress = 0
  car.lap = 0
  car.crashed = false
  car.completedTime = undefined
}

export function createCar(control: 'none'|'ai'|'human'|'bot' = 'none') {

  let color: [number, number, number]
  if(control == 'ai') color = [255, 0, 0]
  else if(control == 'human') color = [0, 200, 200]
  else if(control == 'bot') color = [0, 255, 0]
  else color = [0, 0, 0]

  let car: Car = {
    pos: raceTrack.points[0].clone(),
    vel: 0.001,
    dir: -Math.PI/2,
    steer: 0,
    color,
    sensors: [0, 0, 0],
    sensorConfig: defaultCarSensors,
    control,
    controls: { accelerate: false, brake: false, steer: 0.5 },
    progress: 0,
    lap: 0,
    crashed: false,
  }

  return car
}

export function getCarControl() {
  for(let i = 0; i < cars.length; i++) if(cars[i].control == 'human') return i
  return null
}

export function setCarControl(control:number|null) {
  for(let car of cars) if(car.control == 'human') car.control = 'none'
  if(control !== null) cars[control].control = 'human'
}

export function toScreen(pos: Vector2) {
  return pos.clone().multiply(new Vector2(camera.zoom)).add(camera.pos)
}

export function toWorld(pos: Vector2) {
  return pos.clone().subtract(camera.pos).multiply(new Vector2(1/camera.zoom))
}

export function setLoadedAi(ai: NeuralNetwork) {
  loadedAI = ai
}