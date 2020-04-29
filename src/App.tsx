import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import { ScreenOrientation } from '@ionic-native/screen-orientation';

import Home from './pages/Home';
import Create from './pages/CreateRoom';
import Join from './pages/JoinRoom';
import Game from './pages/Game';
import GameOver from './pages/gameOver';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

const App: React.FC = () => {
  useEffect(() => {
    document.addEventListener("backbutton",function(e) {
      console.log("disable back button")
    }, false);
    ScreenOrientation.lock(ScreenOrientation.ORIENTATIONS.PORTRAIT);
  }, [])

  

 return <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/home" component={Home} exact={true} />
        <Route path="/create" component={Create} exact={true} />
        <Route path="/create/:roomId" component={Create} exact={true} />
        <Route path="/join" component={Join} exact={true} />
        <Route path="/game" component={Game} exact={true} />
        <Route path="/gameover"component={GameOver} exact={true} />
        
        <Route exact path="/" render={() => <Redirect to="/home" />} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
};

export default App;
