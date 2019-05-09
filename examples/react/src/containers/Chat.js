import React, { Component } from 'react';
import PubNubReact from 'pubnub-react';
import OnlineUsers from '../components/OnlineUsers';
import MessageBody from './MessageBody';
import MessagesList from '../components/MessagesList';
import Header from '../components/Header';
import users from '../config/users';
import {publishKey, subscribeKey} from '../config/keys';
import {forestChatChannel} from '../config/chat';


import networkErrorImg from '../styles/networkError.png';
 
export default class extends Component {
    constructor(props) {
        super(props);
        const randomUser = this.getRandomUser();
        this.uuid = randomUser.uuid;
        this.designation = randomUser.designation;
        this.userName = randomUser.firstName + ' ' +  randomUser.lastName;
        this.profileImage = randomUser.profileImage.lgImage;
        this.pubnub = new PubNubReact({
            publishKey,    //publishKey: 'Enter your key . . .'
            subscribeKey,  //subscribeKey: 'Enter your key . . .'
            uuid: this.uuid,
            autoNetworkDetection: true,
            restore: true,
        });
        this.state = {
          sendersInfo: [],
          lastMsgWeekday: '',
          msgsSentDate: [],
          historyLoaded: false,
          historyMsgs: [],
          onlineUsers: [],
          onlineUsersNumber: '',
          networkErrorStatus: false,
          networkErrorImg: null
        }
        this.pubnub.init(this);
    }

    getRandomUser = () => {
      return users[Math.floor(Math.random() * users.length)];
    }

    componentWillMount(){           
      const networkError = new Image();
      networkError.src = networkErrorImg;
      this.setState({networkErrorImg: networkError})

      this.subscribe();

      this.pubnub.getPresence(forestChatChannel, (presence) => {
        if (presence.action === 'join') {
          var users = this.state.onlineUsers;
          users.push({
            state: presence.state,
            uuid: presence.uuid
          })
          this.setState({
            onlineUsers: users,
            onlineUsersNumber: this.state.onlineUsersNumber + 1
          });         
        }

        if ((presence.action === 'leave') || (presence.action === 'timeout')) {
          var leftUsers = this.state.onlineUsers.filter(users => users.uuid !== presence.uuid);
          this.setState({
            onlineUsers: leftUsers
          });
    
          const length = this.state.onlineUsers.length
          this.setState({        
            onlineUsersNumber: length
          });
        }
      });

      this.pubnub.getStatus((status) => {
        if (status.category === 'PNConnectedCategory'){
           this.hereNow();
            this.pubnub.history({
              channel: forestChatChannel,
              reverse: false, 
              stringifiedTimeToken: true
              }, (status, response) => {
                const lastMsgWeekday = this.getWeekday(response.endTimeToken);

                this.setState({
                  historyLoaded: true,
                  historyMsgs: response.messages,
                  lastMsgWeekday
                });

                var msgsSentDate = this.state.historyMsgs.map(msg => this.getWeekday(msg.timetoken));
                this.setState({msgsSentDate})
            });
        }   
                 
        if (status.category === 'PNNetworkDownCategory') 
            this.setState({networkErrorStatus: true});
        if (status.category === 'PNNetworkUpCategory'){
            this.setState({networkErrorStatus: false});
            this.pubnub.reconnect();      
        }
      });

      this.pubnub.getMessage(forestChatChannel, (m) => {
        const sendersInfo = this.state.sendersInfo;
        sendersInfo.push({
          senderId: m.message.senderId,
          text: m.message.text,
          timetoken: m.timetoken,
        });
        this.setState(this.state);


        const lastMsgWeekday = this.getWeekday(m.timetoken)
        this.setState({
          sendersInfo,
          lastMsgWeekday
        });
      });

      window.addEventListener('beforeunload', this.leaveChat);
    }
    
    componentWillUnmount() {
      this.leaveChat();
    }

    subscribe = () => {
      this.pubnub.subscribe({
        channels: [forestChatChannel],
        withPresence: true
      });
    }

    hereNow = () => {
      this.pubnub.hereNow({
        channels: [forestChatChannel],
        includeUUIDs: true,
        includeState: true
      }, (status, response) => {
         this.setState({
          onlineUsers: response.channels[forestChatChannel].occupants,
          onlineUsersNumber: response.channels[forestChatChannel].occupancy
        });

        if (this.state.onlineUsers.map(user => user.uuid).indexOf(this.uuid) === -1)
          this.hereNow();
      });
    }

    leaveChat = () => {
      this.pubnub.unsubscribeAll();
    }

    getTime = (timetoken) => {
      return new Date(parseInt(timetoken.substring(0, 13))).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, minute: 'numeric' })
    }

    getDate = (timetoken, msgType, index = 0) => {
      const msgWeekday = this.getWeekday(timetoken);
      const date = new Date(parseInt(timetoken.substring(0, 13))).toLocaleDateString('en-US', {day: 'numeric', month: 'long'});
      switch (msgType) {
        case 'historyMsg':
            if (this.state.msgsSentDate[index - 1] !== msgWeekday)
              return `${date}, ${msgWeekday}`; 
              break;
        case 'senderMsg':
          if (this.state.lastMsgWeekday !== msgWeekday)
          return `${date}, ${msgWeekday}`;
          break;

        default:
          return;
      }
    }
    
    getWeekday = (timetoken) => {
      const weekday = new Date(parseInt(timetoken.substring(0, 13))).toLocaleDateString('en-US', {weekday: 'long'});
      return weekday;
    }

    findById = (uuid) => {
      const user = users.find( element => element.uuid === uuid );
      if (user)
        return user.firstName + ' ' + user.lastName;
    }

    getUserDesignation = (uuid) => {
      const designation = users.find(element => element.uuid === uuid);
      if (designation)
        return designation.designation;
    }

    getUserImage = (uuid, size) => {
      const image = users.find(element => element.uuid === uuid);
      if (image)
        return image.profileImage[size];
    }

    render() {
        return (
          <div className='grid'>
              <Header 
                userName={this.userName}
                profileImage={this.profileImage}
                usersNumber={this.state.onlineUsersNumber}/>                
              <MessagesList 
                uuid={this.uuid}
                sendersInfo={this.state.sendersInfo}
                findById={this.findById}
                getUserImage={this.getUserImage}
                getTime={this.getTime}
                getDate={this.getDate}
                historyLoaded={this.state.historyLoaded}
                historyMsgs={this.state.historyMsgs}
                networkErrorStatus={this.state.networkErrorStatus}
                networkErrorImg = {this.state.networkErrorImg}/>
              <MessageBody 
                uuid={this.uuid}
                pubnub={this.pubnub}
                findById={this.findById}
                chatName={forestChatChannel}/>
              <OnlineUsers 
                users={users}
                getUserImage={this.getUserImage}
                logedUser={this.uuid}
                findById={this.findById}
                getUserDesignation={this.getUserDesignation}
                onlineUsers={this.state.onlineUsers}/>
          </div>
        );
    }
}