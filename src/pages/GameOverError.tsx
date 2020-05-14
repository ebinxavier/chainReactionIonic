/* eslint-disable react-hooks/exhaustive-deps */
import { people, enter, home } from "ionicons/icons";
import { IonContent, IonHeader, IonPage, IonButton, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonIcon} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import '../components/style.css';

const Card =  (props:any)=>{

  const {winner} = props;

    return <IonContent scrollY={false} style={{textAlign:"center"}} >
            <IonCard mode="ios" color="black" style={{padding:'50px 0'}}>
                    <IonCardHeader>
                    <IonCardSubtitle>{winner==='connectionLost' ? 'CONNECTION LOST':'WINNER IS'}</IonCardSubtitle>
                    <IonCardTitle>{winner==='connectionLost' ? 'OOPS!': winner.toUpperCase()}</IonCardTitle>
                    
                    <h1>GAME OVER</h1>
                    </IonCardHeader>

                    <IonCardContent style={{paddingTop:50}}>
                        <IonButton href="/create" expand="block" color="warning">
                        <IonIcon slot="start" icon={people} />
                            CREATE ROOM
                            </IonButton>
                        <br/>
                        <IonButton href="/join" expand="block" color="success">
                        <IonIcon slot="start" icon={enter} />
                          JOIN ROOM</IonButton>
                        <br/>
                        <IonButton href="/home" expand="block" color="primary">
                        <IonIcon slot="start" icon={home} />
                            HOME</IonButton>
                    </IonCardContent>
            </IonCard>
    </IonContent>
}

function getQueryParam(name:string){
    var value="";
    window.location.search.split('&').forEach(item=>{
        if(item.indexOf(name)!==-1){
            value = item.split(name+'=')[1]
        }
    })
    return value;
}

const Home: React.FC = () => {
  
  const [gameOver] = useState(new Audio('assets/gameOver.mp3'))
	useEffect(() => {
		document.addEventListener("backbutton",function(e) {
		  console.log("disable back button")
    }, false);
    gameOver.play();
    }, [])
      
 const winner = getQueryParam('winner');
  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
        <Card winner={winner}/>
    </IonPage>
  );
};

export default Home;
