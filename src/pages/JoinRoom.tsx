import { 
  IonContent, IonHeader, IonPage, IonButton, IonCard, 
  IonItem, IonCardContent, IonCardHeader, IonCardSubtitle, 
  IonCardTitle, IonInput, IonIcon, IonToast, IonSpinner
} from '@ionic/react';
import React, { useState } from 'react';
import { people, home } from 'ionicons/icons';
import {serverURL} from '../deployment';
import { RouteComponentProps } from 'react-router';


const CreateRoom: React.FC<RouteComponentProps> = ({history}) => {

  const [clickAudio] = useState(new Audio('assets/click.mp3'))
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState<any>()
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");
  const [checkingRoom, setCheckingRoom] = useState(false)

  const isRoomExist = (roomId:string, name:String)=>{
    setCheckingRoom(true);
    return new Promise((resolve, reject)=>{
      fetch(serverURL+'/is-room-exist?roomId='+roomId+'&name='+name)
          .then((response) => {
              return response.json();
          })
          .then((data) => {
              resolve(data.status);
              if(data.status === false){
                setMessage(data.message);
                setShowToast(true);
              }
          })
          .catch((e)=>{
            console.log("Error",e);
            setMessage("Cannot Join! Network Error");
            setShowToast(true);
            resolve(false)
          })
          .finally(()=>setCheckingRoom(false))

    })
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
              <IonCardTitle>JOIN ROOM</IonCardTitle>
            </IonCardHeader>

            <IonCardContent style={{paddingTop:30}}>
              <IonItem>
                <IonInput value={name} placeholder="Your Name" onIonChange={e => setName(e.detail.value!)}></IonInput>
              </IonItem>
            <IonItem style={{marginTop:30}}>
            <IonInput type="text" value={roomId?.toString()} placeholder="Room ID" onIonChange={e => setRoomId(e.detail.value)}></IonInput>
          </IonItem>

              <IonButton  style={{marginTop:30}} onClick={async ()=>{
                clickAudio.play();
                if(!name){
                  setMessage("Enter Your Name")
                } else if(!roomId){
                  setMessage("Enter Room ID")
                } else setMessage("");
                if(!name || !roomId){
                  setShowToast(true);
                  return;
                }
                if(!await isRoomExist(roomId, name)){
                  return;
                }
                
                window.location.replace("/game?roomId="+roomId+"&name="+name);
              }}  expand="block" color="warning">
              {checkingRoom ? <IonSpinner name="crescent"/> : <IonIcon slot="start" icon={people} />}
              JOIN</IonButton>
              <IonButton onClick={async ()=>{
                clickAudio.play();
                history.push("/home")
              } 
              }  
              style={{marginTop:30}} expand="block" color="success">
                <IonIcon slot="start" icon={home} />
              HOME</IonButton>
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
