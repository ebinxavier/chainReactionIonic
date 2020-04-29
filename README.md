

### Add Android to project

`ionic capacitor add android`

### Make web build before Android build

`ionic build`

### Copy content to android

`ionic capacitor copy android`

### Open Android Studio

`npx cap open android`


<div>
			<div id="overlay">
					<div id="text">
					{showModal&&
						<IonContent>
							<IonModal isOpen={showModal}>
							<IonList>
								{totalUsers.map(user=><IonItem><IonLabel style={{textAlign:"center"}}>{user}</IonLabel></IonItem>)}
							</IonList>
								<IonButton onClick={() => setShowModal(false)}>Close Modal</IonButton>
							</IonModal>
							<IonButton onClick={() => setShowModal(true)}>Show Modal</IonButton>
						</IonContent>
					}
					</div>
					<button id="home" style={{display: "none"}} className="myButton">Home</button>
			</div>
			<div style={{width:'100%', height:window.innerHeight}} id="game" ref={ref}/>
		</div>