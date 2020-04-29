import { 
  IonContent, IonHeader, IonPage, IonButton, IonCard, 
  IonItem, IonLabel, IonCardContent, IonCardHeader, IonCardSubtitle, 
  IonCardTitle, IonInput, IonSelect, IonSelectOption, IonToast, IonIcon, IonSpinner
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { shareSocial , home, add, people} from 'ionicons/icons';
import { SocialSharing } from '@ionic-native/social-sharing';

import {serverURL} from '../deployment';
import { RouteComponentProps } from 'react-router';


const CreateRoom: React.FC<RouteComponentProps> = ({history}) => {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState(2);
  const [roomId, setRoomId] = useState<any>();
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");
  const [isCreating , setIsCreating  ] = useState(false)

  const playersArray = [2,3,4,5,6,7,8];

  useEffect(() => {
    console.log('Mounted')
    return () => {
      console.log('Un Mounted')
    }
  }, [])

  const shareViaWhatsApp = async () => {
    try{
      const data = await SocialSharing.share("Let's Play Chain Reaction Online, My Room ID is "+roomId)
      console.log(data);
    } catch(e){
      console.log("Error Social Share", e)
      setMessage("Unable to share using installed apps")
      setShowToast(true);
    }
  };

  const createRoom = ()=>{
    if(!name){
      setMessage("Please Enter Your Name")
      setShowToast(true);
      return
    }

    setIsCreating(true);
    fetch(serverURL+'/create-room-submit?players='+players)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            setRoomId(data.roomId);
        })
        .catch((e)=>{
          console.log("Error",e);
          setMessage("Room Not Created! Network Error");
          setShowToast(true);
        })
        .finally(()=>setIsCreating(false))
  }


  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent scrollY={false}>
      <div className="container">
      <IonCard mode="ios" color="black" style={{padding:'50px 0'}}>
            <IonCardHeader>
              <IonCardSubtitle>CHAIN REACTION</IonCardSubtitle>
              <IonCardTitle>CREATE ROOM</IonCardTitle>
            </IonCardHeader>

            <IonCardContent style={{paddingTop:30}}>
            {roomId ? 
              <>
                <h3>ROOM CREATED</h3>
                <br/>
                <h1>ID: {roomId}</h1>
                <br/>
                <br/>
                <IonButton onClick={shareViaWhatsApp} expand="block" color="warning">
                <IonIcon slot="start" icon={shareSocial} />
                  SHARE
              </IonButton>
                <br/>
              <IonButton href={"/game?roomId="+roomId+"&name="+name+"&host=true"} expand="block">
                <IonIcon slot="start" icon={people} />
                  ENTER ROOM
              </IonButton>
              </>
            : <>
              <IonItem>
                  <IonInput value={name} placeholder="Your Name" onIonChange={e => setName(e.detail.value!)}></IonInput>
              </IonItem>
              <IonItem style={{marginTop:30}}>
                <IonLabel>Players</IonLabel>
                <IonSelect value={players} placeholder="Players" okText="SELECT" cancelText="CANCEL" onIonChange={e => setPlayers(e.detail.value)}>
                      {playersArray.map(player=><IonSelectOption key={player} value={player}>{player}</IonSelectOption>)}
                </IonSelect>
              </IonItem>
              <IonButton key="1"  style={{marginTop:30}} onClick={createRoom} expand="block" color="warning">
              {isCreating?<IonSpinner name="crescent"/>:<IonIcon slot="start" icon={add} />}
              
                CREATE
                </IonButton>
             </> 
             }
              <IonButton 
                key="2"  
                style={{marginTop:30}} 
                onClick={()=>{
                  setRoomId(false);
                  history.push('/home');
                }} 
                expand="block" 
                color="success"
              >
                <IonIcon slot="start" icon={home} />
                HOME
              </IonButton>
          </IonCardContent>
      </IonCard>
      </div>
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={message}
        duration={2000}
        color="danger"
      />
      </IonContent>
    </IonPage>
  );
};

export default CreateRoom;
