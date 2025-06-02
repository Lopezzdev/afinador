//Array con la frecuencia de todas las notas
let notas=[82.4,87.3,92.5,98.0,103.8,110.0,116.5,123.5,130.8,138.6,146.8,155.6,164.8,174.6,185.0,196.0,207.7,220.0,233.1,246.9,261.6,277.2,293.7,311.1,329.6,349.2,370.0,392.0,415.3,440.0,466.2,493.9,523.3,554.4,587.3,622.3,659.3];
let nombres=["E2","F2","F#2","G2","G#2","A2","A#2","B2","C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3","C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4","C5","C#5","D5","D#5","E5"];

let frecuencia;

main();

async function main() {

  //Seteos iniciales
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); //Pedir usar microfono

  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();

  analyser.fftSize = 2048;
  source.connect(analyser);
  const buffer = new Float32Array(analyser.fftSize);

  function loop() {
    analyser.getFloatTimeDomainData(buffer);
    leerFrecuencia(buffer, audioContext.sampleRate);
    graficarOnda(buffer);
    crearArrays();
    // graficarFrecuencias();
    graficarNotas();
    requestAnimationFrame(loop);
  }

  loop();

}

//Analizar microfono
function leerFrecuencia(buf, sampleRate) {

  let SIZE = buf.length; //2048
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i]; //Suma todos los cuadrados de los 2048 números
  rms = Math.sqrt(rms / SIZE); //Hace la raiz cuadrada de la suma total
  if (rms < 0.01) {frecuencia=0;return;}

  let r1 = 0, r2 = SIZE - 1, threshold = 0;
  for (let i = 0; i < SIZE / 2; i++) {  //Recorre la mitad del buffer
    if (Math.abs(buf[i]) > threshold) { 
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) > threshold) {
      r2 = SIZE - i;
      break;
    }
  }

  buf = buf.slice(r1, r2);
  SIZE = buf.length;

  const c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  frecuencia = sampleRate / T0;

}


//Graficar la onda del microfono
const canvas = document.querySelector("#grafico");
const ctx = canvas.getContext("2d");
ctx.strokeStyle = "rgb(194, 124, 45)";
ctx.lineWidth = 2;

function graficarOnda(buf){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.moveTo(0,buf[0]+200);
  for(i=0;i<2048;i++){
    ctx.lineTo(i/2,buf[i]*200+200);
  }
  ctx.stroke();
}


//Creacion de los arrays para ambas ondas
let largoArray = 2000;

let arrayFrecuencias=new Array(largoArray).fill(0); 
let arrayNotas=new Array(largoArray).fill(0); 

let arrayFiltrado = new Array(largoArray).fill(0);
// let precisionFiltro=40,largoFiltro=8;
let precisionFiltro=40,largoFiltro=8;
let notaOK,k;
let notasPrevias=new Array(largoFiltro).fill(0);

let arraySuavizado=new Array(largoArray).fill(0);
let suavizado=5,auxSuavizado=0,conteoAux=0,boolAux=false;

function crearArrays(){
  
  //Array de frecuencias
  arrayFrecuencias.unshift(frecuencia);
  arrayFrecuencias.pop();

  //Array de notas
  if(frecuencia<660&&frecuencia>80)arrayNotas.unshift(740-(17.32*Math.log(frecuencia)-75.4)*20);
  else arrayNotas.unshift(0);

  arrayNotas.pop();

  //Array de notas filtrado
  notasPrevias.unshift(arrayNotas[0]);
  notasPrevias.pop();

  notaOK=true;
  for(k=0;k<largoFiltro;k++){
    if(Math.abs(notasPrevias[k]-arrayNotas[0])>precisionFiltro)notaOK=false;
  }

  if(notaOK)arrayFiltrado.unshift(arrayNotas[0]);
  else arrayFiltrado.unshift(arrayFiltrado[0]);
  arrayFiltrado.pop();

  //Array suavizado

  if(arrayFiltrado[0]==0&&boolAux){boolAux=false;}
  if(arrayFiltrado[0]!=0&&!boolAux){boolAux=true;}
  
  if(boolAux&&conteoAux<suavizado)conteoAux++;
  if(!boolAux)conteoAux=0;

  auxSuavizado=0;
  for(i=0;i<conteoAux;i++)auxSuavizado+=arrayFiltrado[i];
  auxSuavizado=auxSuavizado/conteoAux;

  if(conteoAux==0)auxSuavizado=0;

  arraySuavizado.unshift(auxSuavizado);
  arraySuavizado.pop();

}


//Graficar el historico de frecuencias
// const canvas2 = document.querySelector("#grafico2");
// const ctx2 = canvas2.getContext("2d");

function graficarFrecuencias(){

  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

  //Dibujar notas en frecuencias
  ctx2.strokeStyle = "rgba(0, 0, 0, 0.56)";
  ctx2.lineWidth = 1;

  for(i=0;i<notas.length;i++){
    ctx2.beginPath();
    ctx2.moveTo(0,700-notas[i]);
    ctx2.lineTo(1024,700-notas[i]);
    ctx2.stroke();
  }

  //Dibujar histórico de frecuencias
  ctx2.strokeStyle = "rgb(255, 0, 0)";
  ctx2.lineWidth = 1.5;

  ctx2.beginPath();

  ctx2.moveTo(0,700-arrayFrecuencias[0]);

  for(i=0;i<largoArray;i++){

    ctx2.lineTo(i,700-arrayFrecuencias[i]);

  }

  ctx2.stroke();
  
}


//Graficar el histórico de notas

const canvas3 = document.querySelector("#grafico3");
const ctx3 = canvas3.getContext("2d");
ctx3.lineCap = "round";

let sonidoON,notaAux,afinadoAux,trigger1,aux1;

let semitonos=[0,3,5,7,10,12,15,17,19,22,24,27,29,31,34,36]

function graficarNotas(){

  ctx3.clearRect(0, 0, canvas3.width, canvas3.height);

  //Dibujar piano
  ctx3.strokeStyle = "rgb(82, 82, 82)";
  ctx3.lineWidth = 18;

  for(i=0;i<=37;i++){
    if(semitonos.includes(i)){ctx3.strokeStyle = "rgb(51, 51, 51)";}
    else{ctx3.strokeStyle = "rgb(82, 82, 82)";}
    if(i==9||i==21||i==33)ctx3.strokeStyle="rgb(119, 119, 119)";
    ctx3.beginPath();
    ctx3.moveTo(0,740-i*20);
    ctx3.lineTo(1024,740-i*20);
    ctx3.stroke();
  }

  //Dibujar iluminacion piano
  ctx3.lineWidth = 6;

  ctx3.strokeStyle = "rgba(0, 0, 0, 0.4)";
  // ctx3.strokeStyle = "red";
  for(i=0;i<=37;i++){
    ctx3.beginPath();
    ctx3.moveTo(0,740-i*20+11);
    ctx3.lineTo(1024,740-i*20+11);
    ctx3.stroke();
  }

  //Dibujar sombra de notas

  ctx3.strokeStyle = "rgba(0, 0, 0, 0.64)";
  ctx3.lineWidth = 10;

  ctx3.beginPath();

  ctx3.moveTo(0,arraySuavizado[0]);

  for(i=0;i<largoArray;i++){

    if(arraySuavizado[i]!=0&&!sonidoON){sonidoON=true;ctx3.beginPath();}
    if(arraySuavizado[i]==0&&sonidoON){sonidoON=false;ctx3.stroke();}

    if(sonidoON){ctx3.lineTo(i,arraySuavizado[i]+7);}

  }

  //Dibujar histórico de notas
  ctx3.lineWidth = 6;
  ctx3.strokeStyle = "rgb(109, 218, 76)"; 

  ctx3.beginPath();
  ctx3.moveTo(0,arraySuavizado[0]);

  // if(aux1!=0)console.log(aux1);

  for(i=0;i<largoArray;i++){

    aux1=Math.round(arraySuavizado[i])%20;
    afinadoAux=aux1<5||aux1>15;

    if(!trigger1&&afinadoAux){
      trigger1=true;
      ctx3.stroke();      
      ctx3.strokeStyle="rgb(109, 218, 76)";
      ctx3.beginPath();
      ctx3.moveTo(i,arraySuavizado[i]);
    }
    if(trigger1&&!afinadoAux){
      trigger1=false;
      ctx3.stroke();
      ctx3.strokeStyle="rgb(218, 76, 76)";
      ctx3.beginPath();
      ctx3.moveTo(i,arraySuavizado[i]);
    }

    if(arraySuavizado[i]!=0&&!sonidoON){sonidoON=true;ctx3.beginPath();}
    if(arraySuavizado[i]==0&&sonidoON){sonidoON=false;ctx3.stroke();}

    if(sonidoON){ctx3.lineTo(i,arraySuavizado[i]);}

  }  

  ctx3.stroke();

  //Muestreo de la nota
  notaAux=Math.round(arraySuavizado[0]/20);
  if(notaAux>0&&notaAux<37)document.querySelector("#nota").innerHTML=nombres[36-notaAux];
  else document.querySelector("#nota").innerHTML="-";

}
