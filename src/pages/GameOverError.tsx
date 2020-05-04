import { people, enter } from "ionicons/icons";
import { IonContent, IonHeader, IonPage, IonButton, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonIcon} from '@ionic/react';
import React, { useEffect } from 'react';
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
                        <IonButton routerLink="/create" expand="block" color="warning">
                        <IonIcon slot="start" icon={people} />
                            PLAY AGAIN
                            </IonButton>
                        <br/>
                        <IonButton routerLink="/home" expand="block" color="success">
                        <IonIcon slot="start" icon={enter} />
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

	useEffect(() => {
		document.addEventListener("backbutton",function(e) {
		  console.log("disable back button")
		}, false);
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
