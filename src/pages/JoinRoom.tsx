import { 
  IonContent, IonHeader, IonPage, IonButton, IonCard, 
  IonItem, IonCardContent, IonCardHeader, IonCardSubtitle, 
  IonCardTitle, IonInput, IonIcon, IonToast
} from '@ionic/react';
import React, { useState } from 'react';
import { people, home } from 'ionicons/icons';

const CreateRoom: React.FC = () => {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState<any>()
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");

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

              <IonButton  style={{marginTop:30}} onClick={()=>{
                if(!name){
                  setMessage("Enter Your Name")
                } else if(!roomId){
                  setMessage("Enter Room ID")
                } else setMessage("");
                if(!name || !roomId){
                  setShowToast(true);
                  return;
                }
                window.location.replace("/game?roomId="+roomId+"&name="+name);
              }}  expand="block" color="warning">
              <IonIcon slot="start" icon={people} />
              JOIN</IonButton>
              <IonButton  style={{marginTop:30}} routerLink="/home" expand="block" color="success">
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
