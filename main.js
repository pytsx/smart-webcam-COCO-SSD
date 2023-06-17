const video = document.getElementById('webcam')
const liveView = document.getElementById('liveview')
const webcamButton = document.getElementById('webcamButton')

let model = undefined

cocoSsd.load().then((loadedModel) => {
  model = loadedModel
})

function getUserMediaSupported() {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  )
}

if (getUserMediaSupported()) {
  webcamButton.addEventListener('click', enableWebcam)

} else {
  console.warn('getUserMedia() não está disponível')
}

function enableWebcam(event) {
  if (!model) { return }
  webcamButton.classList.add('invisible')
  const constrains = {
    video: true
  }

  navigator.mediaDevices.getUserMedia(constrains).then((stream) => {
    video.srcObject = stream
    video.addEventListener('loadeddata', predictWebcam)
  })

}


let children = []

let smoothedX = 0
let smoothedY = 0
let smoothedWidth = 0
let smoothedHeight = 0

const smoothingFactor = .3

function predictWebcam() {

  model.detect(video).then((predictions) => {
    for (let i = 0; i < children.length; i++) {
      liveView.removeChild(children[i])
    }
    children.splice(0)

    for (let i = 0; i < predictions.length; i++) {
      let prediction = predictions[i]
      const objectClass = prediction.class
      const confidence = Math.round(parseFloat(prediction.score)) * 100

      if (confidence > 70) {
        const bbox = prediction.bbox
        const x = bbox[0]
        const y = bbox[1]
        const width = Math.round(bbox[2])
        const height = bbox[3]

        // suaviza os valores 

        smoothedX = Math.round(smoothedX * (1 - smoothingFactor) + x * smoothingFactor)
        smoothedY = Math.round(smoothedY * (1 - smoothingFactor) + y * smoothingFactor)
        smoothedWidth = Math.round(smoothedWidth * (1 - smoothingFactor) + width * smoothingFactor)
        smoothedHeight = Math.round(smoothedHeight * (1 - smoothingFactor) + height * smoothingFactor)

        const objectLabel = document.createElement('p')
        const label = `${objectClass} - width ${smoothedWidth} - ${confidence} % confidence`
        objectLabel.innerText = label

        const highlighter = document.createElement('div')
        highlighter.setAttribute('class', 'highlighter')

        highlighter.style = `
          left: ${smoothedX}px;
          top: ${smoothedY}px;
          width: ${smoothedWidth}px;
          height: ${smoothedHeight}px;
        `
        highlighter.appendChild(objectLabel)
        liveView.appendChild(highlighter)
        children.push(highlighter)
      }
    }


    window.requestAnimationFrame(predictWebcam)
  })

}

