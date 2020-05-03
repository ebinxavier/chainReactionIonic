/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable default-case */
import * as THREE from './three.module';
import React, { useEffect, useRef, useState } from 'react';

import io from 'socket.io-client';
import {serverURL} from '../../deployment';

import { IonList, IonItem, IonLabel, IonAvatar, IonSpinner } from '@ionic/react';

let socket = io(serverURL);
const colors = ['red', 'green', 'blue', 'yellow', 'pink', 'orange', 'cyan', 'lightgreen'];

export default () => {
	const ref = useRef(null);
	const [canvasDimension, setCanvasDimension] = useState();
	const [totalUsers, setTotalUsers] = useState([]);
	const [isErrorInRoom, setIsErrorInRoom] = useState(false);
	const [showModal, setShowModal] = useState(true);
	const [playersCount, setPlayersCount] = useState();
	const [playersName, setPlayersName] = useState();
	const [gameOver, setGameOver] = useState(false);

	useEffect(() => {	
		
		if(!canvasDimension) return;

		let camera, scene, renderer;
		camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 1000 );
		camera.position.z = 120;

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
		let playersCount = Number(getQueryParam('roomId').split('-')[1]);
		let roomId = getQueryParam('roomId');
		setPlayersCount(playersCount)
		let playersName= decodeURIComponent(getQueryParam('name'));
		setPlayersName(playersName);
		let currentPlayer = 0;
		
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
			// board.forEach(row=>{
			// 	row.forEach(cell=>{
			// 		cell.forEach(atom=>{
			// 			const sign = parseInt(Math.random()*10)%2 === 0 ? 1 : -1
			// 			const delta = Math.random()/50 * sign;
			// 			atom.position.x+=delta;
			// 			atom.position.y+=delta;
			// 			atom.position.z+=delta;
			// 		})
			// 	})
			// })
			renderer.render( scene, camera );
		}
		animate();



		// Game Play

		function changeCellColor(color){
			scene.traverse(item=>{
				if(item.name.indexOf('line')!==-1){
					item.material.color.set(color)
				}
			})
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
						window.location.replace('/gameover?winner='+window.totalUsers[index]);
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

		var isAnimating = 0;
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
				isAnimating ++;
				await animateAtomBreakout(breakingOut, {x: x * w - width/2, y:y * w - height/2 }, sphere);
				isAnimating--;
				if(!isAnimating) {
					console.log("FN:Animation Done", onComplete);
					if(onComplete) onComplete('breakout');
					findNextPlayer({});
					checkGameOver();
					if(gameOver) {
						console.log("Game Over", color, 'Won')
						// onOverlay(color[0].toUpperCase()+color.slice(1)+" Won!");
					}
				}
			}

			sphere.position.x = x * w - width/2;
			sphere.position.y = y * w - height/2;
			sphere.color = color;
			if(!board[x]) board[x] = [];
			if(!board[x][y]) board[x][y] = [];
			
			var shouldAddSphere = true;
			var breakedOut=false;
			switch(board[x][y].length){
				case 1: 
						if(isCorner(x,y)){ // Breakout
							board[x][y].forEach(e=>scene.remove(e));
							board[x][y] = [];
							let neighours = getNeighbours(x,y);
							neighours.forEach(async e=>{
								await addNewAtom(...e, color, {x: x * w - width/2, y:y * w - height/2 },onComplete)
							});
							shouldAddSphere = false;
							breakedOut = true;
						} else {
							board[x][y][0].position.x-=.75;
							sphere.position.x+=.75;
						}
					break;
				case 2: 
						if(isEdge(x,y)){ // Breakout
							board[x][y].forEach(e=>scene.remove(e));
							board[x][y] = [];
							let neighours = getNeighbours(x,y);
							neighours.forEach(async e=>{
								await addNewAtom(...e, color, {x: x * w - width/2, y:y * w - height/2 }, onComplete)
							});
							shouldAddSphere = false;
							breakedOut = true;
						} else {
							board[x][y][0].position.y-=.55;
							board[x][y][1].position.y-=.55;
							sphere.position.y+=.55;
						}
					break;
				case 3: board[x][y].forEach(e=>scene.remove(e));
						board[x][y] = [];
						// Breakout
						var neighours = getNeighbours(x,y);
						neighours.forEach(async e=>{
							await addNewAtom(...e, color, {x: x * w - width/2, y:y * w - height/2 }, onComplete)
						})
						shouldAddSphere = false;
						breakedOut = true;
					break;
			}
			if(shouldAddSphere){
				board[x][y].forEach(e=>{
					e.color = color;
					e.material.color.set(color);
				})
				board[x][y].push(sphere);
				scene.add( sphere );
				checkGameOver();
			}
			if(!breakingOut && !breakedOut){ // breakedOut means this addition caused breaking
				console.log("FN:Normal Addition Done");
				if(onComplete) onComplete('normal');
				findNextPlayer({noDelay: true});
			}
		}

		var turn=0;
		var timerId;

		function findNextPlayer({noDelay = false, skip = false}){
			clearTimeout(timerId);
			timerId = setTimeout(()=>{
			if(isAnimating) return;
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

			
			console.log("Next Player: "+colors[playersAvailable[currentPlayer]]);
			changeCellColor(colors[playersAvailable[currentPlayer]]);
			

			// timerId = setInterval(function emitClick(){ 
			// 	if(!playerClickedOneCellAckPending){
			// 		clearInterval(timerId);
			// 		console.log("Next Player: "+colors[playersAvailable[currentPlayer]]);
			// 		changeCellColor(colors[playersAvailable[currentPlayer]]);
			// 	} else {
			// 		// Makes repeated emits till gets Ack.
			// 		emitPlayerClickedOneCell(playerClickedOneCellAckPending);
			// 	}
			// 	return emitClick; // Immediate set interval
			// }(), 1000)
					
			},noDelay?1000:1000)
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
		function onClick(event){
			if(isModelOpen || avoidDoubleClick || isSimulating || colors[playerId] !== colors[playersAvailable[currentPlayer]]) return;
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
		
		socket.on('playerClickedOneCell',(data)=>{
			const params = JSON.parse(data.message);
			historySequence++;
			console.log("playerClickedOneCell: ", data, historySequence)
			handleAddAtom({x:params.x, y:params.y, fromSocket:true});
			timeOutQuery();
		})

		socket.on('start',()=>{
			offOverlay();
		})

		socket.on('gameOver',({winner})=>{
			window.location.replace('/gameover?winner='+winner);
		})

		socket.on('someOneLeft', ()=>{
			setGameOver(true);
			socket.emit('gameOver', {roomId}  ,(ack)=>{
				window.location.replace('/gameover?winner=connectionLost');
			});

		})


		function getQueryParam(name){
			var value="";
			window.location.search.split('&').forEach(item=>{
				if(item.indexOf(name)!==-1){
					value = item.split(name+'=')[1]
				}
			})
			return value;
		}

		function offOverlay() {
			setTimeout(()=>{
				setShowModal(false);
				isModelOpen = false;
			}, 2000);
			// document.getElementById("overlay").style.display = "none";
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
		document.addEventListener("backbutton",function(e) {
		  console.log("disable back button")
		}, false);
	  }, [])

	  return (
		<div>
			<div>
					<div id="text">
					{showModal&&
							// <IonModal isOpen={showModal}>
									<IonList>
									<IonItem type="button">
										<IonLabel color="warning" style={{textAlign:"center", fontSoze:12}}>
											{
											(playersCount - ( totalUsers?.length || 1)) === 0 
											?
											<div>ALL FRIENDS ARE JOINED</div>
											:
											<div>WAITING FOR {playersCount ? (playersCount - ( totalUsers?.length || 1)) +'MORE':''} FRIEND{ (playersCount - ( totalUsers?.length || 1))!==1 ? 'S':''}</div>
											}
											{(playersCount - ( totalUsers?.length || 1))!==0 ? <span><IonSpinner name="dots"/></span>:''}
										 </IonLabel>
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
							// </IonModal>
					}
					</div>
					<button id="home" style={{display: "none"}} className="myButton">Home</button>
			</div>
			<div style={{width:'100%', height:window.innerHeight}} id="game" ref={ref}/>
		</div>
	)
}
