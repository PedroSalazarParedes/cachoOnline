import { Mongo } from "meteor/mongo";
import { Meteor } from "meteor/meteor";

export const Partidas = new Mongo.Collection("games");

if (Meteor.isServer) {
  Meteor.publish("myGame", (id1) => {
    return Partidas.find({_id:id1});
  });
}

function darDados(numDados){
  let k;
  let arr=[]
  for(k=0; k< numDados; ++k){
    arr.push(Math.floor(Math.random() * 6) + 1);
  }
  return arr;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function mod(a,b) {
  return (a % b + b)%b;
}

Meteor.methods({

  createPartida: function(admin){

    let a= Partidas.insert({
      admin:admin,
      comenzada:false,
      jugadores:[admin],
      turnos:[],
      numDados:[],
      dados:[],
      terminada: false,
      ganador: undefined,
      turnoActual:-1,
      //sentido derecha: 0 --- sentido izquierda: 1
      sentidoRonda:-1,
      ultimaJugada:""
    });
    let res2= Meteor.users.findOne({_id:this.userId});
    res2.profile.juegos.push(a);
    Meteor.users.update({_id:this.userId},res2);
    return a;
  },

  comenzarPartida: function(idPartida){

    let res= Partidas.findOne({_id:idPartida});
    res.comenzada=true;
    res.turnos=shuffle(res.jugadores);
    let i,j;
    for (i = 0; i < res.jugadores.length; ++i) {
      res.numDados.push(6);
    }
    for(j = 0; j < res.jugadores.length; ++j){
      res.dados.push(darDados(res.numDados[j]));
    }
    let r=res.turnoActual;
    r++;
    res.turnoActual=r;
    Partidas.update({_id:idPartida},res);
  },

  joinPartida: function(idPartida, idJugador){

    let res= Partidas.findOne({_id:idPartida});
    if(res.jugadores.length===6){
      throw new Meteor.Error("El juego esta lleno");
    }
    else if(typeof(res)==="undefined"){
      throw new Meteor.Error("No existe la partida");
    }
    else if(res.comenzada){
      throw new Meteor.Error("La partida ya comenzó",Partidas.rawDatabase);
    }
    else{
      res.jugadores.push(idJugador);
      Partidas.update({_id:idPartida},res);
      let res2= Meteor.users.findOne({username:idJugador});
      res2.profile.juegos.push(idPartida);
      Meteor.users.update({username:idJugador},res2);
    }
  },
  apostar: function(apuesta, idPartida) {
    let res= Partidas.findOne({_id:idPartida});
    res.ultimaJugada = apuesta;
    Partidas.update({_id:idPartida},res);
  },
  asignarSentido: function(idPartida, sentido) {
    let res= Partidas.findOne({_id:idPartida});
    res.sentidoRonda = sentido;
    Partidas.update({_id:idPartida},res);
  },
  cambiarTurno: function(idPartida) {
    let res= Partidas.findOne({_id:idPartida});
    if(res.sentidoRonda===0) {
      let a = res.turnoActual+1;
      let b = res.jugadores.length;
      res.turnoActual = mod(a,b);
    }
    else if(res.sentidoRonda===1) {
      let a = res.turnoActual-1;
      let b = res.jugadores.length;
      res.turnoActual = mod(a,b);
    }
    Partidas.update({_id:idPartida},res);    
  }
});
