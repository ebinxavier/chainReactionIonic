import { IonContent, IonHeader, IonPage, IonButton, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonIcon} from '@ionic/react';
import React from 'react';
import '../components/style.css';
import { people, enter } from 'ionicons/icons';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent scrollY={false} >
      <div className="container">
      <IonCard mode="ios" color="black" style={{padding:'50px 0'}}>
            <IonCardHeader>
              <IonCardSubtitle>PLAY WITH FRIENDS</IonCardSubtitle>
              <IonCardTitle>CHAIN REACTION</IonCardTitle>
            </IonCardHeader>

            <IonCardContent style={{paddingTop:50}}>
              <IonButton routerLink="/create" expand="block" color="warning">
              <IonIcon slot="start" icon={people} />
                CREATE ROOM
                </IonButton>
              <br/>
              <IonButton routerLink="/join" expand="block" color="success">
              <IonIcon slot="start" icon={enter} />
                JOIN ROOM</IonButton>
          </IonCardContent>
      </IonCard>
      </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
