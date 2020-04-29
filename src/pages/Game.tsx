import { IonContent, IonHeader, IonPage, IonButton, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent} from '@ionic/react';
import React from 'react';
import '../components/style.css';
import Game from '../components/GameLogic';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent scrollY={false} >
      <div>
        <Game/>
      </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
