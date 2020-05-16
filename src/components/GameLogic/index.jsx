/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable default-case */
import * as THREE from './three.module';
import React, { useEffect, useRef, useState } from 'react';

import io from 'socket.io-client';
import {serverURL} from '../../deployment';
import ChatView from '../Chat';

import { IonList, IonItem, IonLabel, IonAvatar, IonSpinner, IonButton, IonIcon} from '@ionic/react';
import { people, person, chatbubbles, chatbubbleEllipses, closeOutline } from 'ionicons/icons';

let socket = io(serverURL);
const colors = ['red', 'green', 'blue', 'yellow', 'pink', 'orange', 'cyan', 'lightgreen'];
const CHAT_LIMIT = 20; 

export default ({history}) => {
	const ref = useRef(null);
	const [canvasDimension, setCanvasDimension] = useState();
	const [totalUsers, setTotalUsers] = useState([]);
	const [isErrorInRoom, setIsErrorInRoom] = useState(false);
	const [showModal, setShowModal] = useState(true);
	const [showChat, setShowChat] = useState(false);
	const [playersCount, setPlayersCount] = useState();
	const [currentPlayer, setCurrentPlayer] = useState();
	const [currentPlayerColor, setCurrentPlayerColor] = useState();
	const [playersName, setPlayersName] = useState();
	const [gameOver, setGameOver] = useState(false);
	const [gameStarted, setGameStarted] = useState(false);
	const [gotNewMsg, setGotNewMsg] = useState(false);
	// const explosionAudio = explosion(new Audio('assets/explosion.mp3'));
	const [clickAudio] = useState(new Audio('assets/click.mp3'))
	const [explosionAudio] = useState(new Audio('assets/explosionShort.mp3'))
	const [gameStart] = useState(new Audio('assets/gameStart.mp3'))


	function getQueryParam(name){
		var value="";
		window.location.search.split('&').forEach(item=>{
			if(item.indexOf(name)!==-1){
				value = item.split(name+'=')[1]
			}
		})
		return value;
	}

	function gotoBottom(id){
		var element = document.getElementById(id);
		if(element){
			element.scrollTop = element.scrollHeight - element.clientHeight;
		}
	 }


	useEffect(() => {	
		
		if(!canvasDimension) return;

		gameStart.play();

		let camera, scene, renderer;
		camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 1000 );
		camera.position.z = 120;
		camera.position.y = 2.5;

		scene = new THREE.Scene();

		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setSize( canvasDimension.width, canvasDimension.height );
		document.getElementById('game').appendChild( renderer.domElement );


		window.addEventListener( 'resize', onWindowResize, false );

		function onWindowResize(){

			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();

			renderer.setSize( window.innerWidth, window.innerHeight );

		}

		let width = 20;
		let height = 50;
		let w=5; // cell width
		let maxColumns = parseInt(width/w);
		let maxRows = parseInt(height/w);
		let board = [];
		let boardCompound = [];
		let playersCount = Number(getQueryParam('roomId').split('-')[1]);
		let roomId = getQueryParam('roomId');
		setPlayersCount(playersCount)
		let playersName= decodeURIComponent(getQueryParam('name'));
		let isHost = !!getQueryParam('host')
		setPlayersName(playersName);
		let currentPlayer = 0;
		let gameHistory =[];
		
		let playersAvailable =[];
		let oneRoundCompleted = false;
		let playerId;
		let base;
		let playerClickedOneCellAckPending = false

		console.log('playersName', playersName);


		for(let i=0;i<playersCount;i++) playersAvailable.push(i);

		function drawCell(x, y, w, i, j, color=0xff0000){
			// Meshes
			var material = new THREE.LineBasicMaterial({
				color: color
			});
			
			var points = [];
			points.push( new THREE.Vector3( x-w, y-w, -1 ) );
			points.push( new THREE.Vector3( x+w, y-w, -1 ) );
			points.push( new THREE.Vector3( x+w, y+w, -1 ) );
			points.push( new THREE.Vector3( x-w, y+w, -1 ) );
			points.push( new THREE.Vector3( x-w, y-w, -1 ) );
			
			var geometry = new THREE.BufferGeometry().setFromPoints( points );
			
			var line = new THREE.Line( geometry, material );
			line.castShadow = true; //default is false
			line.receiveShadow = false; //default
			line.name = 'line,'+i+','+j;
			scene.add(line);


			geometry = new THREE.PlaneGeometry( w*2, w*2 );
			material = new THREE.MeshBasicMaterial( {color: 0xffff00, visible:false} );
			var plane = new THREE.Mesh( geometry, material );
			plane.position.x = x;
			plane.position.y = y;
			plane.position.z = -1;
			plane.name = 'plane,'+i+','+j;
			scene.add( plane );
		}
		function init(){

			// THREE JS 

			// Ambient Light
			var light = new THREE.AmbientLight( 0x404040, 1.5 ); // soft white light
			scene.add( light );

			// Spotlight
			var spotLight = new THREE.SpotLight( 0xffffff, 1 );
			spotLight.position.set( 25, 0 , 10 );

			spotLight.castShadow = true;

			spotLight.shadow.mapSize.width = 1024;
			spotLight.shadow.mapSize.height = 1024;

			spotLight.shadow.camera.near = 500;
			spotLight.shadow.camera.far = 4000;
			spotLight.shadow.camera.fov = 30;

			scene.add( spotLight );


			// Base 
			var geometry = new THREE.BoxGeometry(width+9, height+9, 1);
			var material = new THREE.MeshBasicMaterial( { color: 0x111111 } );
			base = new THREE.Mesh( geometry, material );

			base.receiveShadow = true;
			base.position.z=-5;
			scene.add( base );

			geometry = new THREE.BoxGeometry(width+9.5, height+9.8, 1);
			material = new THREE.MeshBasicMaterial( { color: 0x0, transparent: true } );
			material.opacity = 0.5;
			base = new THREE.Mesh( geometry, material );

			base.receiveShadow = true;
			base.position.z=-6;
			scene.add( base );
			
			// Cells

			for(var x=0, i=0 ;x<=width; x+=w, i++)
				for(var y=0, j=0;y<=height;y+=w,j++){
					drawCell(x - width/2,y-height/2, w/2, i, j)
				}
		}
		init();

		function animate() {
			requestAnimationFrame( animate );
			boardCompound.forEach((row, x)=>{
				row.forEach((compound, y)=>{
					if(compound.children.length>1){
						let speedFactor = 1;
						if(compound.children.length === 3 || (isEdge(x,y) && compound.children.length === 2)){
							speedFactor = 3;
						}
						const delta = Math.random()/50 * speedFactor;
						compound.rotation.x+=delta;
						compound.rotation.y+=delta;
						compound.rotation.z+=delta;
						}
					
				})
			})
			renderer.render( scene, camera );
		}
		animate();



		// Game Play

		function changeCellColor(color){
			scene.traverse(item=>{
				if(item.name.indexOf('line')!==-1){
					item.material.color.set(color);
					item.position.z = 0;
				}
			})
			const lastAction = gameHistory[gameHistory.length-1];
			if(lastAction){
				const name=lastAction.x+','+lastAction.y;
				const line = scene.children.find(e=>e.name.indexOf(name)!==-1);
				if(line){
				line.material.color.setColorName(lastAction.color)
				line.position.z=0.1
				}
			}

			setCurrentPlayer(window.totalUsers[colors.indexOf(color)]);
			setCurrentPlayerColor(color);
		}

		function isCorner(x,y){
			return((x=== 0 || x=== maxColumns) && (y === 0 || y === maxRows))
		}

		function isEdge(x, y){
			return !isCorner(x, y) && (x === maxColumns || y === maxRows || x === 0 || y === 0 )
		}

		function isCenter(x, y){
			return !isCorner(x,y) && !isEdge(x,y);
		}

		function isInside(x,y){
			return x>=0 && x<=maxColumns && y>=0 && y<= maxRows;
		}

		function getNeighbours(x, y){
			var neighours =[];
			var p1 = [x+1, y];
			var p2 = [x-1, y];
			var p3 = [x, y+1];
			var p4 = [x, y-1];
			if(isInside(...p1)) neighours.push(p1);
			if(isInside(...p2)) neighours.push(p2);
			if(isInside(...p3)) neighours.push(p3);
			if(isInside(...p4)) neighours.push(p4);
			return neighours;
		}

		function animateAtomBreakout(from, to, atom){
			scene.add(atom);
			var dx = (from.x - to.x)/10;
			var dy = (from.y - to.y)/10;
			return new Promise((resolve)=>{
				var counter = 0;
				atom.position.x = from.x;
				atom.position.y = from.y;
				var id = setInterval(()=>{
					atom.position.x-= dx;
					atom.position.y-= dy;
					if(counter=== 8) {
						clearInterval(id);
						scene.remove(atom);
						resolve();
					}
					counter++;
				}, 20)
			})
		}

		function checkGameOver(){
			if(oneRoundCompleted){
				var result = new Set();
				board.forEach(row=>{
					row.forEach(cell=>{
						if(cell[0] && cell[0].color) result.add(cell[0] && cell[0].color)
					})
				})
				setGameOver(Array.from(result).length===1);
				if(Array.from(result).length===1){
					const winColor = Array.from(result)[0];
					const index = colors.indexOf(winColor);
					socket.emit('gameOver', {roomId, winner: window.totalUsers[index]}  ,()=>{
						history.replace('/gameover?winner='+window.totalUsers[index]);
					});
				}
			}
		}

		function checkPlayerExist(color){
			var exist = false;
			board.forEach(row=>{
				row.forEach(cell=>{
					if(cell[0] && cell[0].color === color) exist = true;
				})
			})
			return exist;
		}

		function updatePlayersAvailable(){
			var newPlayers = playersAvailable.filter(e=>{
				return checkPlayerExist(colors[e])
			})
			if(playersAvailable.length !== newPlayers.length){
				// playersAvailable = newPlayers;
				console.log("One Player Out!");
			}
			return newPlayers;
		}

		var animationCount = 0;
		var isAnimating = false;
		var breakedOutAnimationTimer;

		async function addNewAtom(x,y, color, breakingOut = false, onComplete){ // Adds the atom to the cell
			if(gameOver) return;
			if(x===-1 && y=== -1 ){ // Skip chance because of time out
				findNextPlayer({skip:true});
				return;
			}
			var geometry = new THREE.SphereGeometry( 1, 32, 32 );
			var nodeMaterial = new THREE.MeshPhongMaterial( { 
				color: color,
				specular: 0x050505,
				shininess: 80
			} ) 
			var sphere = new THREE.Mesh( geometry, nodeMaterial );
			if(breakingOut){
				animationCount ++;
				await animateAtomBreakout(breakingOut, {x: x * w - width/2, y:y * w - height/2 }, sphere);
				animationCount--;
				if(!animationCount) {
					clearTimeout(breakedOutAnimationTimer)
					breakedOutAnimationTimer = setTimeout(()=>{
						if(!animationCount) {
							console.log("FN:Animation Done");
							isAnimating = false;
							if(onComplete) onComplete('breakout');
							findNextPlayer({});
							checkGameOver();
							if(gameOver) {
								console.log("Game Over", color, 'Won')
								// onOverlay(color[0].toUpperCase()+color.slice(1)+" Won!");
							}
						}
					}, 500)
				}
			}

			sphere.position.x = x * w - width/2;
			sphere.position.y = y * w - height/2;
			sphere.color = color;
			if(!board[x]) board[x] = [];
			if(!board[x][y]) board[x][y] = [];

			if(!boardCompound[x]) boardCompound[x] = [];
			if(!boardCompound[x][y]) {
				boardCompound[x][y] = new THREE.Group();
				scene.add( boardCompound[x][y] );
				boardCompound[x][y].add( sphere );
			}
			
			var shouldAddSphere = true;
			var breakedOut=false;
			switch(board[x][y].length){
				case 1: 
						if(isCorner(x,y)){ // Breakout
							board[x][y] = [];
							for (let i = boardCompound[x][y].children.length - 1; i >= 0; i--) {
								boardCompound[x][y].remove(boardCompound[x][y].children[i]);
							}
							let neighours = getNeighbours(x,y);
							neighours.forEach(async e=>{
								await addNewAtom(...e, color, {x: x * w - width/2, y:y * w - height/2 },onComplete)
							});
							shouldAddSphere = false;
							breakedOut = true;
							explosionAudio.play();
						}
					break;
				case 2: 
						if(isEdge(x,y)){ // Breakout
							board[x][y] = [];
							for (let i = boardCompound[x][y].children.length - 1; i >= 0; i--) {
								boardCompound[x][y].remove(boardCompound[x][y].children[i]);
							}
							let neighours = getNeighbours(x,y);
							neighours.forEach(async e=>{
								await addNewAtom(...e, color, {x: x * w - width/2, y:y * w - height/2 }, onComplete)
							});
							shouldAddSphere = false;
							breakedOut = true;
							explosionAudio.play();
						}
					break;
				case 3: 
						board[x][y] = [];
						for (let i = boardCompound[x][y].children.length - 1; i >= 0; i--) {
							boardCompound[x][y].remove(boardCompound[x][y].children[i]);
						}
						// Breakout
						var neighours = getNeighbours(x,y);
						neighours.forEach(async e=>{
							await addNewAtom(...e, color, {x: x * w - width/2, y:y * w - height/2 }, onComplete)
						})
						shouldAddSphere = false;
						breakedOut = true;
						explosionAudio.play();
					break;
			}
			if(shouldAddSphere){
				board[x][y].forEach(e=>{
					e.color = color;
					e.material.color.set(color);
				})
				
				boardCompound[x][y].add(sphere)
				boardCompound[x][y].position.set(Math.floor(sphere.position.x), Math.floor(sphere.position.y), sphere.position.z);
				
				// Arrange atoms when new atom comes
				switch(boardCompound[x][y].children.length){
					case 2:
						boardCompound[x][y].children[0].position.x=-0.5;
						boardCompound[x][y].children[1].position.x=0.5
						break;
					case 3:
						boardCompound[x][y].children[0].position.x=-.5
						boardCompound[x][y].children[0].position.y=-.55
						boardCompound[x][y].children[1].position.x=.5
						boardCompound[x][y].children[1].position.y=-.55
						boardCompound[x][y].children[2].position.y=0.5
				}
				
				sphere.position.set(Math.abs(sphere.position.x%1),Math.abs(sphere.position.y%1),0);
				board[x][y].push(sphere);
				checkGameOver();
			}
			if(!breakingOut && !breakedOut){ // breakedOut means this addition caused breaking
				console.log("FN:Normal Addition Done");
				clickAudio.play();
				if(onComplete) onComplete('normal');
				findNextPlayer({noDelay: true});
			} else if(!breakingOut && breakedOut) {
				console.log("Animation Starts");
				isAnimating = true;
			}
		}

		var turn=0;
		var timerId;

		function findNextPlayer({noDelay = false}){

			if(!isHost) return;
			timerId = setTimeout(()=>{
			if(animationCount) return;
			if(oneRoundCompleted){
				var newPlayers = updatePlayersAvailable();
				do{
					turn++;
					currentPlayer = turn;
					currentPlayer %= playersCount;
				} while(!newPlayers.includes(currentPlayer))
			} else {
				turn++;
				currentPlayer = turn;
				currentPlayer %= playersCount;
			}

			// Checks whether playerClickedOneCellAckPending ack to avoid event loss

			socket.emit('nextPlayer', { 
				roomId: roomId, 
				playerId: currentPlayer
			});

			console.log("Next Player: "+colors[playersAvailable[currentPlayer]]);
			changeCellColor(colors[playersAvailable[currentPlayer]]);
					
			},noDelay?100:500)
		}

		// Ray caster

		var raycaster = new THREE.Raycaster();
		var mouse = new THREE.Vector2();

		function handleAddAtom({x, y, color, fromSocket = false, onComplete}){ // check whether the cell is free or of the same color
			checkGameOver();
				if(!fromSocket){
					// console.log(`Clicked: (${x}, ${y}, ${color || colors[playersAvailable[currentPlayer]]})`)
					const payloadToServer = { 
						room: getQueryParam('roomId'), 
						message: JSON.stringify({
							x:x, 
							y:y, 
							color: color || colors[playersAvailable[currentPlayer]],
						})
					}
					playerClickedOneCellAckPending = {...payloadToServer};
					emitPlayerClickedOneCell(payloadToServer);
				}
				addNewAtom(x, y, color || colors[playersAvailable[currentPlayer]],false,  onComplete );
				if(!oneRoundCompleted && currentPlayer === playersCount-1){
					oneRoundCompleted = true;
				}        
		}

		let isSimulating = false;
		let avoidDoubleClick = false;
		let isModelOpen = true;
		let clicked = false;
		function onClick(event){
			if(!clicked){
				clicked = true;
				setTimeout(()=>clicked=false, 500);
				onClickAction(event);
			}
		}


		function onClickAction(event){
			if(gameHistory[historySequence-1] && gameHistory[historySequence-1].color === colors[playerId]) return; // Already played
			if(window.showModal || isAnimating || isModelOpen || avoidDoubleClick || isSimulating || colors[playerId] !== colors[playersAvailable[currentPlayer]]) return;
			mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
			mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
			// update the picking ray with the camera and mouse position
			raycaster.setFromCamera( mouse, camera );

			// calculate objects intersecting the picking ray
			var intersects = raycaster.intersectObjects( scene.children );

			for ( var i = 0; i < intersects.length; i++ ) {
				if(intersects[ i ].object.name.indexOf('plane')!==-1){
					var coords = intersects[ i ].object.name.split(',')
					var x = Number(coords[1]);
					var y = Number(coords[2]);
					const correctCell = board[x] && board[x][y] && board[x][y][0] && (board[x][y][0].color === colors[playerId]);
					if(correctCell !== false){
						avoidDoubleClick = true;
						handleAddAtom({x,y, fromSocket:false});
						setTimeout(()=>{avoidDoubleClick = false}, 2000);
					}
					break;
				}
			}

		}

		function handleAddAtomAsync({x, y, color}){
			return new Promise((onComplete)=>{
				handleAddAtom({x,y,color, fromSocket:true, onComplete: (msg)=>{
					console.log("onComplete", msg)
					
					setTimeout(()=>onComplete(), 600);
				}
			});

			})
		}

		async function simulateHistoryClick(history){
			isSimulating = true;
			for(let action of history){
				await handleAddAtomAsync(JSON.parse(action));
			}
			isSimulating = false;
		}

		window.addEventListener( 'click', onClick, false );


		// SOCKET.IO
		let historySequence = 0;
		socket.emit('subscribe', {roomId, name: playersName}, data=>{
			if(Number(roomId.split('-')[1]) === data.count){
				socket.emit('start', { 
					room: roomId, 
					message: "Start the Game"
				});
				offOverlay();
				setCurrentPlayerColor('red');
				setCurrentPlayer(data.users[0]);
			}
			console.log(data)
			if(data.error) setIsErrorInRoom(true);
			setTotalUsers(data.users);
			window.totalUsers = data.users;

			playerId = data.userIndex-1;
			if(data.historySequence){ // Already some history in room
				console.log("Game alredy started!!");
				syncHistory();
			}
			var color = new THREE.Color();
			color.set(colors[playerId]);
			base.material.color = color;

			// // Keep Alive communication
			// setInterval(()=>{
			// 	console.log("Keep Alive")
			// 	socket.emit('keepAlive', { 
			// 		room: roomId, 
			// 		user: playersName
			// 	});
			// },5000)
		});

		function syncHistory(){
			socket.emit('getHistoryCount',{roomId}, historyCount=>{
					if(historySequence !== historyCount){
						socket.emit('getHistory',{roomId}, history=>{
							// console.log('getHistory', history);
							simulateHistoryClick(history.slice(historySequence));
							historySequence = history.length;
						})
					}
					timeOutQuery();
			})
		}

		socket.on('disconnect', () => {
			socket.emit('unSubscribe', {roomId, playersName})
			console.log('Socket disconnected: ');			
		  })

		function emitPlayerClickedOneCell(payload){
			gameHistory.push(JSON.parse(payload.message));
			socket.emit('playerClickedOneCell', payload ,(ack)=>{
				console.log("Ack. from server: ", ack);
				historySequence++;
				playerClickedOneCellAckPending = false;
			});
		}

		socket.on('newUserJoined',(data)=>{
			console.log("New User Joined:",data);
			setTotalUsers(data.users);
			window.totalUsers = data.users;
		})

		let timeOutQueryTimer;
		function timeOutQuery(){
			clearTimeout(timeOutQueryTimer);
			timeOutQueryTimer = setTimeout(()=>{
				console.log("Querying new state after timeout!!")
				syncHistory();
			}, 10000)
		} 

		let timeOutSkipTimer;
		function timeOutSkip(){
			clearTimeout(timeOutSkipTimer);
			timeOutSkipTimer = setTimeout(()=>{
				console.log("Skipping Chance")

				if(window.totalUsers[currentPlayer] === playersName){
					handleAddAtom({x:-1,y:-1, fromSocket:false});
				}
			}, 100000)
		} 
		
		socket.on('playerClickedOneCell',(data)=>{
			const params = JSON.parse(data.message);
			gameHistory.push(params);
			historySequence++;
			console.log("playerClickedOneCell: ", data, historySequence)
			handleAddAtom({x:params.x, y:params.y, color: params.color, fromSocket:true});
			timeOutQuery();
			// timeOutSkip();
		})

		socket.on('start',()=>{
			setCurrentPlayerColor('red');
			setCurrentPlayer(window.totalUsers[0]);
			offOverlay();
		})

		socket.on('gameOver',({winner})=>{
			history.replace('/gameover?winner='+winner);
		})

		socket.on('nextPlayer',(playerId)=>{
			currentPlayer = playerId;
			changeCellColor(colors[playersAvailable[currentPlayer]]);
		})

		socket.on('someOneLeft', ()=>{
			setGameOver(true);
			socket.emit('gameOver', {roomId}  ,(ack)=>{
				history.replace('/gameover?winner=connectionLost');
			});

		})

		socket.on('onNewChat',(data)=>{
			if(!(getQueryParam('chat')==='true'))
				setGotNewMsg(true);
			const history = window.chatHistory ? window.chatHistory :[]
			let chatHistoryNew = [...history];
			chatHistoryNew.push(data);
			if(chatHistoryNew.length > CHAT_LIMIT)
				chatHistoryNew = chatHistoryNew.slice(chatHistoryNew.length - (CHAT_LIMIT), chatHistoryNew.length)
			setChatHistory(chatHistoryNew);
			window.chatHistory = chatHistoryNew;
			gotoBottom('chatBox');
		})
		

		function offOverlay() {
			setTimeout(()=>{
				setShowModal(false);
				isModelOpen = false;
				setGameStarted(true);
			}, 2000);
		}

	}, [canvasDimension])




	useEffect(() => {
		setTimeout(()=>{
			if(ref.current){
				const width = ref.current ? ref.current.offsetWidth : 0;
				const height = ref.current ? ref.current.offsetHeight : 0;
				setCanvasDimension({width, height});
			}
		}, 1000);
	}, [ref])

	useEffect(() => {
		document.addEventListener("backbutton",function(event) {
			event.preventDefault();
          	event.stopPropagation();
		  	console.log("disable back button");
		}, false);
	  }, [])

	const [chatHistory, setChatHistory] = useState([]);

	const handleNewChat = (data)=>{
		socket.emit('onNewChat', {roomId:getQueryParam('roomId'), data});
		let chatHistoryNew = [...chatHistory];
		chatHistoryNew.push(data);
		if(chatHistoryNew.length > CHAT_LIMIT)
			chatHistoryNew = chatHistoryNew.slice(chatHistoryNew.length - (CHAT_LIMIT), chatHistoryNew.length)
		setChatHistory(chatHistoryNew);
		window.chatHistory = chatHistoryNew;
		setTimeout(()=>gotoBottom('chatBox'));
	}

	  return (
		<div>
			<div 
			style={{
				position: 'absolute',
				top: '0px',
				width: '100%',
				textAlign: 'center',
				zIndex: '100',
				display:'block'
			}}
			>
			{gameStarted && <IonButton  color="warning" onClick={()=>{
				window.showModal = !showModal;
				setShowModal(!showModal);
				}
			}>
				<IonIcon style={{margin:0}} slot="end" icon={people} />
			</IonButton>}

			<IonButton color={gotNewMsg?"danger":"success"} onClick={()=>{
				setTimeout(()=>gotoBottom('chatBox'));
				history.push(window.location.pathname+window.location.search+'&chat=true')
				setShowChat(!showChat);
				setGotNewMsg(false);
			}}>
				<IonIcon className={gotNewMsg?"slide-top":""} style={{margin:0}} slot="end" icon={ gotNewMsg ? chatbubbleEllipses : chatbubbles } />
			</IonButton>

			{currentPlayer && <IonButton 
				color="light"
				>
				<span style={{color: currentPlayerColor}}>
					<IonIcon slot="end" icon={person} />
					{' '+currentPlayer.toUpperCase()}
				</span>
			</IonButton>}
			{getQueryParam('chat')==='true' && <ChatView 
							you={playersName} 
							chatHistory={chatHistory}
							onNewChat={handleNewChat}	
							back={()=>{
								setShowChat(false);
								setGotNewMsg(false);
								// debugger
								// console.log(history)
								if(getQueryParam('chat')==='true')
									history.goBack();
							}}
						/>
			}		
			</div>
			<div>
					
					<div id="text" style={{width:"90%"}}>
					{showModal&&
									<IonList>
									<IonItem type="button">
										{!gameStarted ? <IonLabel color="warning" style={{textAlign:"center", fontSoze:12}}>
											{
											(playersCount - ( totalUsers?.length || 1)) === 0 
											?
											<div>ALL FRIENDS ARE JOINED</div>
											:
											<div>WAITING FOR {playersCount ? (playersCount - ( totalUsers?.length || 1)) +'MORE':''} FRIEND{ (playersCount - ( totalUsers?.length || 1))!==1 ? 'S':''}</div>
											}
											{(playersCount - ( totalUsers?.length || 1))!==0 ? <span><IonSpinner name="dots"/></span>:''}
										 </IonLabel> :
										 [
											<IonLabel color="warning" style={{textAlign:"center", fontSoze:12}}>FRIENDS</IonLabel>,
											<IonLabel color="warning" style={{textAlign:"right", fontSoze:12}}>
												<IonIcon 
													size="large"
													onClick={()=>{
														window.showModal = false;
														setShowModal(false);
													}
													}
													slot="end" icon={closeOutline} />
											</IonLabel>
										]
										 
										}
										</IonItem>
									{totalUsers?.map((user, index)=>
										<IonItem color="light" key={user} >
										<IonAvatar slot="start">
											<div style={{background:colors[index], height:40, borderRadius:20}}></div>
										</IonAvatar>
										<IonLabel style={{color:"lightgray"}}>{user.toUpperCase()}{user===playersName ? ' ( YOU )':''}</IonLabel>
									</IonItem>
									)}
								
								</IonList>								 
					}
					</div>
			</div>
			<div style={{
				width:'100%', 
				height:window.innerHeight,
				}} id="game" ref={ref}/>
		</div>
	)
}
