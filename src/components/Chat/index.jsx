import React, { useState } from 'react'
import { IonIcon } from '@ionic/react';
import { send } from 'ionicons/icons';
import moment from 'moment';
import './style.scss'


const MyMessage = ({
    data,
    time
    })=>(
    <li className="clearfix">
        <div className="message-data">
        <span className="message-data-name"><i className="fa fa-circle online"></i> You</span>
        <span className="message-data-time">{moment(time).format('h:mm a')}</span>
        </div>
        <div className="message my-message">
            {data}
        </div>
    </li>
);

const OtherMessage = ({
    name,
    data,
    time
    })=>(
        <li className="clearfix">
        <div className="message-data align-right">
        <span className="message-data-time" >{moment(time).format('h:mm a')}</span> &nbsp; &nbsp;
        <span className="message-data-name" >{name}</span> <i className="fa fa-circle me"></i>
        
        </div>
        <div className="message other-message float-right">
            {data}
        </div>
    </li>
);

const Chat = ({
    you,
    chatHistory,
    onNewChat
}) => {

    const [inputText, setInputText] = useState("")

    const handleMessage = ()=>{
        onNewChat({
            name:you,
            data:inputText,
            time:moment().utc().valueOf(),
        })
        setInputText('');
    }
    return (
        <div onClick={(event)=>{
            event.preventDefault();
            event.stopPropagation();
        }}>
            <div id="chatBox" className="chat" style={{
                overflow:'auto',
                background:'#131313',
                height:'calc( 90vh - 45px )'
            }}>
                <div className="chat-history">
                <ul>
                {chatHistory.map(message=>{

                    if(message.name === you) return (
                    <MyMessage 
                        key={message.time}
                        data={message.data}
                        time={message.time}
                    />
                    )
                    return (
                    <OtherMessage 
                        key={message.time}
                        name={message.name} 
                        data={message.data}
                        time={message.time}
                    />
                    )
                })}
                
                </ul>
            </div>
            
            </div>
            <div  style={{
                background:'#131313',
                height:'calc( 10vh )'
            }}>
                <input 
                    value={inputText}
                    type="text" 
                    placeholder="Type Message"
                    style={{
                        width: '90%',
                        borderRadius: '5px',
                        height: '45px',
                        padding: '5px',
                        background:'#131313',
                        margin: '10px 5%',
                        border:'1px solid #4a4a4a'
                    }}
                    onChange={e=>setInputText(e.target.value)}
                    ></input>

                <IonIcon 
                    onClick={handleMessage}
                    style={{
                        position: 'relative',
                        top: '-62px',
                        right: '-40%',
                        padding: '20px'
                        }} 
                    slot="end" icon={send} />
            </div>
        </div>
    )
}

export default Chat
