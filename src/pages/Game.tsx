import { IonContent, IonHeader, IonPage} from '@ionic/react';
import React from 'react';
import '../components/style.css';
import Game from '../components/GameLogic';
import { RouteComponentProps } from 'react-router';

const Home: React.FC<RouteComponentProps> = ({history}) => {
  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent scrollY={false} >
      <div>
        <Game history={history}/>
      </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
